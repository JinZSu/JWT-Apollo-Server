import { ApolloServer, AuthenticationError } from "apollo-server-express";
import express from "express";
import expressJWT from "express-jwt";
import { ApolloError } from 'apollo-server-errors';

import resolvers from "./resolvers.js";
import typeDefs from "./typeDefs.js";

const port = 4000; // Port Number
const app = express();

app.use( //Use of JWT Tokens 
    expressJWT({
        secret: "SECRET", //Normally should be imported in env variable, but for poc I did this
        algorithms: ["HS256"], //Symmertrical signing algo
        credentialsRequired: false //false because I need to generate the JWT
    })
);


//getUsers():
// you would get users by id
// each id would return the permissions of the user
// roles: ["Brower_Andy"],
// permissions: ["read:any_user", "read:own_user"]

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => { //This is where the Authenication happens. Decodes JWT from middleware
    const user = req.user || null; //If token is not available e.g. JWT not generate yet
    if (user) {
        console.log(user)
        const email = user['https://localhost/4000']['email'] || "Default";
        const auth = user['https://localhost/4000']['auth-provider'] || null;
        const appname = user['https://localhost/4000']['appname'] || null;
        if (appname === "senior-parsley") { //Special case for appname: senior-parsley
            if (auth === "SSO" && /@parsleyhealth.com\s*$/.test(email)) { //Validation of the email Doamin and auth-provider
                console.log("DING DING DING");
                throw new ApolloError("Super secret PHI data!", "Auth_Successful", null);//If successful then get the Data
                return { user }; //Returns the user
            }
            else {
                throw new ApolloError("ERROR. YOU CANNOT LOG IN LIKE THIS TO senior-parsley", "senior-parsley ERROR_AUTH", null);//If successful then get the Data
                return null; //Return nothing
            }
        }
        return { user }; //Returns the user
    }
    return { user }; //Returns null since user doesn't exist
    },
    formatError: (err) => { //Format output so it looks better
        if (err.message.startsWith("Context creation failed: ERROR. YOU CANNOT LOG IN LIKE THIS TO senior-parsley")) {
            return new Error("ERROR. YOU CANNOT LOG IN LIKE THIS TO senior-parsley")
        }
        if (err.message.startsWith("Context creation failed: Super secret PHI data!")) {
            return new Error("Super secret PHI data!")
        }
        return err;
    }
});

await server.start();

server.applyMiddleware({ app ,path: '/HAPI'});

app.listen({ port }, () => {
    console.log(`:Rocket_Emoji Server is located at http://localhost:${port}${server.graphqlPath}`);
});