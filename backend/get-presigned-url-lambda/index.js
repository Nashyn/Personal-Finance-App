const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');


const s3 = new AWS.S3();


const BucketName = 'financialdatabucket';

exports.handler = async (event) => {
  try {
   
    if (!event.body) {
      throw new Error('Invalid input: No body provided');
    }


    const requestBody = JSON.parse(event.body);

    
    if (!requestBody.fileType) {
      throw new Error('File type is required');
    }

    
    const fileType = requestBody.fileType;

    
    const fileKey = `uploads/${uuidv4()}`;

    const s3Params = {
      Bucket: BucketName,
      Key: fileKey,
      Expires: 300, 
      ContentType: fileType,
    };

    const uploadURL = s3.getSignedUrl('putObject', s3Params);

   
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", 
      },
      body: JSON.stringify({
        uploadURL: uploadURL,
        key: fileKey,
      }),
    };
  } catch (err) {
    console.error('Error creating pre-signed URL', err);
    
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*", 
      },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
