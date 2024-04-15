const AWS = require('aws-sdk');
const cloudFormation = new AWS.CloudFormation();
const s3 = new AWS.S3();

exports.handler = async (event) => {
   
    const params = {
        StackName: 'Cloud-stack'
    };

    try {
        const data = await cloudFormation.describeStacks(params).promise();
        const outputs = data.Stacks[0].Outputs;

        
        const userFinanceApiUrl = outputs.find(output => output.OutputKey === 'UserFinanceApiInvokeURL').OutputValue;
        const taxCalculationApiUrl = outputs.find(output => output.OutputKey === 'TaxCalculationApiInvokeURL').OutputValue;

        
        const responseBody = {
            userFinanceApiUrl,
            taxCalculationApiUrl
        };

        
        const s3params = {
            Bucket: 'fetchurlbucket', 
            Key: 'apiConfig.json', 
            Body: JSON.stringify(responseBody),
            ContentType: "application/json"
        };

        await s3.putObject(s3params).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'API URLs updated successfully in S3' })
        };
    } catch (error) {
        console.error("Error fetching stack details or uploading to S3", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
