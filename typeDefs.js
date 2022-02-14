import { gql } from "apollo-server-express";

export default gql`
    type User{
        id: ID!
        name: String
        email: String!
        password: String
        roles: [String]
        permissions: [String]
    }   
    type Query {
        user(id: ID!): User
        viewer: User!
    }

    type Mutation {
        login(email: String!, password: String!, appname: String!): String
        SSO(email: String!, appname: String!): String
    }

`;