### Approach and Validation

To begin I needed to generate JWT. I initally generated it via jwt.io and passed it in without signature validation. 
However I have never touched graphql and wanted to use this chance to learn it. 
I began by creating two authenication methods; SSO and login. These two methods would help me generate the jwt toy tokens needed for the following requirements
```
\\ auth-provider: SSO or auth-provider: user-pass
\\ email: Jin@Jin.com
\\ password: (only for login)
\\ appname: $appname (senior-parsley)
```
I validation the creation these JWT by having a view method created in graphql. 
The follow are what I used to generate jwt tokens for both the user-pass and SSO
login()

```
mutation {
  login(email: "Jin@Parsley.com", password: "Secure_Password",appname:"senior-parsley")
}
```
SSO()
```
mutation {
  SSO(email: "Jin@Parsley.com", appname:"senior-parsley")
}
```
Both the SSO and login returns a generated JWT. Ran both of these functions on https://studio.apollographql.com/sandbox/explorer
Sample decoded JWT
```
{
  'https://localhost/4000': {
    id: '348123163',
    roles: [ 'BackPain' ],
    permissions: [ 'read:own_user' ],
    appname: 'sasdenior-parsley',
    email: 'Jin@parsleyhealth.com.com',
    'auth-provider': 'SSO'
  },
  iat: 1644795240,
  exp: 1644881640,
  sub: '348123163'
}
```

I validation both by performing a basic query on https://studio.apollographql.com/sandbox/explorer?endpoint=http%3A%2F%2Flocalhost%3A4000%2FHAPI&explorerURLState=N4IgJg9gxgrgtgUwHYBcQC4QEcYIE4CeABAGoCWCA7vkcADp51JFEBuF1etDTLLSAQ0Q9mRAL4ixIADQhWAvGQEAjADYIAzhhAgxQA
```
query Viewer {
  viewer {
    name
  }
}

With Headers as follows
Authorization | bearer [Token]
```
With the creation of this foundation began the core problem of 
```
For requests from one web application in particular, named senior-parsley, we need to be
able to apply certain rules. We would like to return a valid response when the following
conditions are met:
Toy token auth-provider == SSO
AND
Toy token email contains @parsleyhealth.com as an email suffix.
HAPI returns an error message when those conditions are not met.
```
The solution that I came up with was to generate a filter in the middleware
```
    context: ({ req }) => { //This is where the Authenication happens. Decodes JWT from middleware
    const user = req.user || null; //If token is not available e.g. JWT not generate yet
    if (user) {
        const email = user['https://localhost/4000']['email'] || "Default";
        const auth = user['https://localhost/4000']['auth-provider'] || null;
        const appname = user['https://localhost/4000']['appname'] || null;
        if (appname === "senior-parsley") { //Special case for appname: senior-parsley
            if (auth === "SSO" && /@parsleyhealth.com\s*$/.test(email)) { //Validation of the email Doamin and auth-provider
                throw new ApolloError("Super secret PHI data!", "Auth_Successful", null);//If successful then get the Data
                return { user }; //Returns the user
            }
            else {
                throw new ApolloError("ERROR. YOU CANNOT LOG IN LIKE THIS TO senior-parsley", "senior-parsley ERROR_AUTH", null);//If successful then get the Data
                return null; //Return nothing
            }
        }
        return { user }; //Returns the user for all the other other appnames
    }
    return { user }; //Returns null since user doesn't exist
    },
```
Just when I thought I was done, I realized that the final requirement was 
```
Please create a GraphQL endpoint that accepts an empty body request (only headers) and
responds appropriately given the problem statement.
```
I wasn't too sure where graphql was living, so I ran a quick wireshark and found that these querys exist within the body of the request. 
![alt text](https://github.com/JinZSu/JWT-Apollo-Server/blob/main/Fotos/postmanlogin.PNG?raw=true)

To validate, I downloaded Postman to generate the JWT and run them with an empty body. What I got in return was that 
```
\\ POST body missing, invalid Content-Type, or JSON object has no keys.
```
To keep things simple, I reverse engineered how that message was being sent. What I discovered was that Apollo-server 
contains an ApolloError which allows me to override any error message. I customized a few and on Postman sent two packets. 
The first being a JWT with SSO
![alt text](https://github.com/JinZSu/JWT-Apollo-Server/blob/main/Fotos/postmansso.PNG?raw=true)

The second being a JWT with login
![alt text](https://github.com/JinZSu/JWT-Apollo-Server/blob/main/Fotos/Wireshark.png?raw=true)

