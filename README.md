# Personal Finance App

Welcome to the GitHub repository for the Personal Finance App, a robust web-based application designed to help individuals manage their finances, perform tax calculations, and visualize financial data. This application leverages a microservices architecture with a React-based frontend, serverless AWS Lambda backend, and AWS CloudFormation for infrastructure management.

## Features

- **Expense Tracking:** Log and categorize expenses to monitor spending.
- **Income Management:** Track income sources and integrate with expense data for net financial analysis.
- **Tax Calculations:** Utilize dedicated Lambda functions to estimate taxes based on user inputs and financial data.
- **Secure Data Handling:** All data transactions are secured with AWS services, ensuring data integrity and security.
- **Scalable Infrastructure:** Utilize AWS CloudFormation to efficiently manage and scale resources as needed.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/)
- [Docker](https://www.docker.com/) (optional, for running the application in a container)
- [AWS CLI](https://aws.amazon.com/cli/) configured with an AWS account

## Installation

### Frontend Setup

Navigate to the frontend directory and install the required dependencies:

```
cd frontend
npm install
```

### To run the application locally
```
npm start
```

### Backend Setup
```
cd backend
# Deploy commands for AWS Lambda functions
aws lambda update-function-code --function-name <function-name> --zip-file fileb://<path-to-your-zip>
```

### Cloudformation
```
aws cloudformation deploy --template-file cloudformation/cloud_formation.yml --stack-name PersonalFinanceStack
```

## Usage
Once the frontend and backend are set up, the web application will be accessible via your browser. Use the application to manage your personal finances, visualize data through interactive charts, and calculate taxes using the provided tools.

