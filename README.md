LPMIS

Homedash 
- Style the login page with two feilds -> Phone number and 4 digit password.
- Only after login the user will be able to see the Home Page.
- Home page will have a nave bar and body below. Nav bar will have two options -> Personal, Group
- Personal Dashboard will show the users personal details 
- Group Dashboard will show the users the group details they are included in. 
- There will be three main sections in both the view  

Common Components 
-> Transaction Section 
    - This section will show the transaction for user or the group
    - Get all the transaction details for user or group from API 
    - Show the transaction details as table. 
    - Add a button at the top of the table that will add new row with editable cells that user can fill and save using create API  
    - Table columns -> date, amount, desc, type

-> Stock Section 
    - This section will show the stocks for user or the group
    - Get all the stock details for user or group from API 
    - Show the stock details as table. 
    - Add a button at the top of the table that will add new row with editable cells that user can fill and save using create API 
    - Table columns -> Item name, quantity

-> Cart Section 
    - This section will show the cart for user or the group
    - Get all the cart details for user or group from API 
    - Show the cart details as table. 
    - Add a button at the top of the table that will add new row with editable cells that user can fill and save using create API 
    - Table column -> Item name, store, cost, note

Pages 
URL Routers in Client -> 
1. /login -> Login Page 
    Renders the Proper Login Page with Homedash Logo and Name and two fields -> 
    1. Mobile Number +91 XXXXXXXXXXX ( 10 digits )  Required 
    2. OTP / Password -> 4 Digits Required 

    Submit button -> After submit button entered -> API Call for /homedash/validate-user after which routing will change to "/".
    Using the response of validate-user the user_details will be saved in local storage with key "logged_in_user" so that next time the user opens the app -> Take the phone_number and otp -> send to /homedash/validate-user API. 
2. / -> Home Page 
    This page will have two components -> 
    1. Nav Bar with two options -> "Me" and "My Group" and a hamburger icon to show logout option in menu
    2. Two Cards in the body -> "Me" and "My Group"

    In both the case Me -> Route to /personal and My Group -> Route to /groups
    Logout will route to /login and delete the "logged_in_user" from local storage. 
3. /personal -> Personal View 
    Personal View will have three sections -> My Transaction, My Stock, My Carts
    1. My Transaction Section will render Transaction table based on my user_id saved in local storage. 
    Transaction Table with a add transaction button at the top. Refer to the Transaction section above. 
    2. My Stock section will render Stock table based on my user_id saved in local storage. 
    Stock Table will add stock button at the top. Refer to the Stock section above. 
    3. My Cart section will render Cart table based on my user_id saved in local storage. 
    Cart Table will add stock button at the top. Refer to the Cart section above. 
4. /groups -> Group View 
    On this page, From the get all group API filters with my user_id show a list of groups in cards which inlcudes my user_id. 
    Clicking on paticular group will show me three sections -> My Group Transaction, My Group Stock, My Group Cart
    1. My Transaction Section will render Transaction table based on my group_id. 
    Transaction Table with a add transaction button at the top. Refer to the Transaction section above. 
    2. My Stock section will render Stock table based on my group_id
    Stock Table will add stock button at the top. Refer to the Stock section above. 
    3. My Cart section will render Cart table based on my group_id
    Cart Table will add stock button at the top. Refer to the Cart section above. 

Refer to the openapi.json file for all the API references the payload and response details. 
Make and Use Commom Components across pages. Try to make generic components which can be used in Transaction, Cart and Stock for Persona view and Group View. 
Dont make assumptions as such clarify before making any assumptions. 


