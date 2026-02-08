import Text "mo:core/Text";
import Array "mo:core/Array";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import OutCall "http-outcalls/outcall";
import Stripe "stripe/stripe";

actor {
  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Management
  public type UserProfile = {
    userId : Text;
    aadhaarMasked : Text;
    email : Text;
    name : Text;
  };

  public type ShoppingItem = Stripe.ShoppingItem;

  // Payment Record
  public type PaymentRecord = {
    transactionId : Text;
    userId : Text;
    amount : Nat;
    currency : Text;
    status : Text;
    paymentMethod : Text;
    timestamp : Int;
    description : Text;
  };

  // Storage for user profiles (by userId)
  let userProfiles = Map.empty<Text, UserProfile>();
  
  // Storage for mapping Principal to userId
  let principalToUserId = Map.empty<Principal, Text>();
  
  // Storage for user profiles by Principal (for required interface)
  let userProfilesByPrincipal = Map.empty<Principal, UserProfile>();

  // Records Map for payment records
  let paymentRecords = Map.empty<Text, [PaymentRecord]>();

  // Stripe configuration
  var stripeConfiguration : ?Stripe.StripeConfiguration = null;

  // Transform function for HTTP Outcalls
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // Required profile management functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfilesByPrincipal.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfilesByPrincipal.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfilesByPrincipal.add(caller, profile);
    userProfiles.add(profile.userId, profile);
    principalToUserId.add(caller, profile.userId);
  };

  // User Management
  public shared ({ caller }) func registerUser(aadhaarNumber : Text, email : Text, name : Text) : async UserProfile {
    let maskedAadhaar = maskAadhaar(aadhaarNumber);
    let userId = generateUserId(maskedAadhaar);

    if (userProfiles.containsKey(userId)) {
      Runtime.trap("User with this Aadhaar number already exists");
    };

    let userProfile : UserProfile = {
      userId;
      aadhaarMasked = maskedAadhaar;
      email;
      name;
    };

    userProfiles.add(userId, userProfile);
    principalToUserId.add(caller, userId);
    userProfilesByPrincipal.add(caller, userProfile);
    
    // Assign user role to the registered user
    AccessControl.assignRole(accessControlState, caller, caller, #user);
    
    userProfile;
  };

  public shared ({ caller }) func authenticateUser(userId : Text) : async UserProfile {
    // Verify caller owns this userId or is admin
    if (not verifyUserOwnership(caller, userId)) {
      Runtime.trap("Unauthorized: Can only authenticate your own user");
    };
    
    switch (userProfiles.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) { profile };
    };
  };

  // Payment Processing
  public query func isStripeConfigured() : async Bool {
    stripeConfiguration != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    stripeConfiguration := ?config;
  };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (stripeConfiguration) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?config) { config };
    };
  };

  public shared ({ caller }) func createPayment(userId : Text, amount : Nat, currency : Text, description : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create payments");
    };
    
    // Verify caller owns this userId
    if (not verifyUserOwnership(caller, userId)) {
      Runtime.trap("Unauthorized: Can only create payments for your own account");
    };
    
    ignore authenticateUserSync(userId);
    let items = [{
      currency;
      productName = description;
      productDescription = "Payment for " # description;
      priceInCents = amount;
      quantity = 1;
    }];
    let successUrl = "https://example.com/success";
    let cancelUrl = "https://example.com/cancel";
    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
  };

  public shared ({ caller }) func recordPayment(userId : Text, transactionId : Text, amount : Nat, currency : Text, status : Text, paymentMethod : Text, description : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can record payments");
    };
    
    // Verify caller owns this userId
    if (not verifyUserOwnership(caller, userId)) {
      Runtime.trap("Unauthorized: Can only record payments for your own account");
    };
    
    let record : PaymentRecord = {
      transactionId;
      userId;
      amount;
      currency;
      status;
      paymentMethod;
      timestamp = Time.now();
      description;
    };

    switch (paymentRecords.get(userId)) {
      case (null) {
        paymentRecords.add(userId, [record]);
      };
      case (?existingRecords) {
        paymentRecords.add(userId, existingRecords.concat([record]));
      };
    };
  };

  public query ({ caller }) func getMyPaymentHistory(userId : Text) : async [PaymentRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view payment history");
    };
    
    // Verify caller owns this userId or is admin
    if (not verifyUserOwnership(caller, userId)) {
      Runtime.trap("Unauthorized: Can only view your own payment history");
    };
    
    ignore authenticateUserSync(userId);
    switch (paymentRecords.get(userId)) {
      case (null) { [] };
      case (?records) { records };
    };
  };

  public query ({ caller }) func getPaymentRecord(userId : Text, transactionId : Text) : async ?PaymentRecord {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view payment records");
    };
    
    // Verify caller owns this userId or is admin
    if (not verifyUserOwnership(caller, userId)) {
      Runtime.trap("Unauthorized: Can only view your own payment records");
    };
    
    ignore authenticateUserSync(userId);
    switch (paymentRecords.get(userId)) {
      case (null) { null };
      case (?records) {
        var found : ?PaymentRecord = null;
        for (record in records.values()) {
          if (record.transactionId == transactionId) {
            found := ?record;
          };
        };
        found;
      };
    };
  };

  public shared ({ caller }) func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check session status");
    };
    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  // Masking and ID Generation
  func maskAadhaar(aadhaarNumber : Text) : Text {
    if (aadhaarNumber.size() != 12) {
      Runtime.trap("Invalid Aadhaar number format");
    };

    // Convert to character array
    let chars = aadhaarNumber.toArray();

    // Take first 4 characters
    let visible = Array.tabulate(
      4,
      func(i) { chars[i] }
    );

    // Add 4 '*' characters
    let masked = Array.repeat('*', 4);

    // Take last 4 characters
    let remaining = Array.tabulate(
      4,
      func(i) { chars[i + 8] }
    );

    // Concatenate all parts
    let combined = visible.concat(masked).concat(remaining);

    // Convert back to Text
    Text.fromArray(combined);
  };

  func generateUserId(maskedAadhaar : Text) : Text {
    let timestamp = Time.now();
    timestamp.toText() # maskedAadhaar;
  };

  public query func isRegistered(userId : Text) : async Bool {
    userProfiles.containsKey(userId);
  };

  public query ({ caller }) func getMaskedAadhaar(userId : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view masked Aadhaar");
    };
    
    // Verify caller owns this userId or is admin
    if (not verifyUserOwnership(caller, userId)) {
      Runtime.trap("Unauthorized: Can only view your own masked Aadhaar");
    };
    
    switch (userProfiles.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) { profile.aadhaarMasked };
    };
  };

  public shared ({ caller }) func getMaskedAadhaarSync(userId : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view masked Aadhaar");
    };
    
    // Verify caller owns this userId or is admin
    if (not verifyUserOwnership(caller, userId)) {
      Runtime.trap("Unauthorized: Can only view your own masked Aadhaar");
    };
    
    switch (userProfiles.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) { profile.aadhaarMasked };
    };
  };

  // Helper function for authenticated user lookup
  func authenticateUserSync(userId : Text) : UserProfile {
    switch (userProfiles.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) { user };
    };
  };

  // Helper function to verify user ownership
  func verifyUserOwnership(caller : Principal, userId : Text) : Bool {
    // Admin can access any user's data
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return true;
    };
    
    // Check if caller owns this userId
    switch (principalToUserId.get(caller)) {
      case (null) { false };
      case (?callerUserId) { callerUserId == userId };
    };
  };
};
