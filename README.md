# GraphQL Profile Page

A profile page application that displays user information from a GraphQL API. The application includes user authentication, interactive statistics graphs, and visualization of school-related data.

**Live Demo:** [graphql.aalhamed.org](https://graphql.aalhamed.org)

## Features

- User authentication with JWT
- Login support for both username/password and email/password
- Profile dashboard displaying:
  - User identification
  - XP tracking
  - Grades overview
  - SVG-based statistical graphs
- Interactive data visualization
- Secure API communication

## Tech Stack

- HTML/CSS/JavaScript
- GraphQL for data querying
- SVG for statistical graphs
- JWT for authentication

## Authentication

The application uses JWT-based authentication:

- Endpoint: `https://((DOMAIN))/api/auth/signin`
- Authentication: Basic auth with base64 encoding
- Supports both username:password and email:password
- JWT token used for subsequent GraphQL API calls

## GraphQL API

The application queries data from: `https://((DOMAIN))/api/graphql-engine/v1/graphql`

Key data tables:

### User Table
```graphql
{
  user {
    id
    login
  }
}
```

### Transaction Table (XP and Audits)
```graphql
{
  transaction {
    id
    type
    amount
    objectId
    userId
    createdAt
    path
  }
}
```

### Progress & Results Tables
```graphql
{
  progress {
    id
    userId
    objectId
    grade
    createdAt
    path
  }
}
```

## Statistical Visualizations

The application includes SVG-based graphs showing:
- XP progression over time
- Project success ratios
- Audit statistics
- Custom data visualizations

## Setup & Usage

1. Clone the repository
2. Open index.html in your browser
3. Log in using your credentials
4. Navigate through your profile data and statistics

## Security

- All API calls require valid JWT authentication
- Token is stored securely
- Logout functionality provided
- Error handling for invalid credentials

## GraphQL Query Examples

Basic user query:
```graphql
{
  user {
    id
    login
  }
}
```

Nested query with arguments:
```graphql
{
  object(where: { id: { _eq: 3323 }}) {
    name
    type
  }
}
```

Combined nested query:
```graphql
{
  result {
    id
    user {
      id
      login
    }
  }
}
```
