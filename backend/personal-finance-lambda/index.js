const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');


const dynamoDb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const textract = new AWS.Textract();
const SNS = new AWS.SNS();

const TableName = 'UserFinancialData';
const BucketName = 'financialdatabucket'; 
const TopicArn = process.env.FINANCE_NOTIFICATION_TOPIC_ARN; 

exports.handler = async (event) => {
  try {
    
    const requestBody = JSON.parse(event.body);
    const userEmail = requestBody.email;
    let financialData;



    if (requestBody.imageKey) {
      const imageData = await analyzeImage(BucketName, requestBody.imageKey);
      financialData = mapTextractToFinancialData(imageData);
    } else {
     
      financialData = requestBody.financialData;
    }
    
    console.log(financialData)
    const financialMetrics = calculateFinancialMetrics(financialData);

    console.log(financialMetrics)
    await saveToDynamoDB(userEmail, financialData, financialMetrics);

    await subscribeToTopic(userEmail);
    await sendEmailNotification(userEmail, financialMetrics);

   
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", 
        "Content-Type": "application/json"
        
      },
      body: JSON.stringify({
        message: 'Data processed and stored successfully',
        financialData: financialData,
        financialMetrics: financialMetrics
      }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*", 
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ error: 'An error occurred processing your request' }),
    };
  }
};

function mapTextractToFinancialData(textractData) {
  let financialData = {
    cashAccounts: 0,
    realEstate: 0,
    stocks: 0,
    bonds: 0,
    savings: 0,
    liabilities: 0,
    loans: 0,
    crypto: 0,
  };

  let currentCategory = null;
  
  const lines = textractData.Blocks.filter(block => block.BlockType === 'LINE');

  lines.forEach(line => {
    
    if (isNaN(parseFloat(line.Text))) {
      
      currentCategory = line.Text.replace(/\s+/g, '');
    } else {
     
      const value = parseFloat(line.Text.trim());
      if (currentCategory && !isNaN(value)) {
        const key = convertCategoryToKey(currentCategory);
        if(key) financialData[key] = value;
      }
      currentCategory = null; 
    }
  });

  return financialData;
}

function convertCategoryToKey(category) {
  const mapping = {
    'CashAccounts': 'cashAccounts',
    'RealEstate': 'realEstate',
    'Stocks': 'stocks',
    'Bonds': 'bonds',
    'Savings': 'savings',
    'Liabilities': 'liabilities',
    'Loans': 'loans',
    'Crypto': 'crypto'
  
  };

  return mapping[category] || null;
}



function extractValue(textractData, category) {
  let extractedValue = 0; 

  
  const keyBlock = textractData.Blocks.find(block =>
    block.BlockType === 'KEY_VALUE_SET' &&
    block.EntityTypes.includes('KEY') &&
    block.Text.includes(category)
  );

  
  if (keyBlock) {
    const valueBlockId = keyBlock.Relationships?.find(r => r.Type === 'VALUE')?.Ids[0];
    const valueBlock = textractData.Blocks.find(block => block.Id === valueBlockId);
    
    
    if (valueBlock && valueBlock.Text) {
      const valueString = valueBlock.Text.trim().replace(/[^0-9.-]+/g, "");
      extractedValue = parseFloat(valueString);
    }
  }

  return extractedValue;
}



function calculateFinancialMetrics(data) {
  
  const netWorth = data.cashAccounts + data.realEstate + data.stocks + data.bonds + data.savings - data.liabilities - data.loans;
  const dti = data.liabilities / (data.cashAccounts + data.realEstate + data.stocks + data.bonds + data.savings); 
  const savingsRate = data.savings / ((data.cashAccounts + data.realEstate + data.stocks + data.bonds + data.savings) - data.liabilities - data.loans);

  return {
    netWorth,
    dti,
    savingsRate,
    
  };
}

const subscribeToTopic = async (email) => {
  const params = {
    Protocol: 'email',
    TopicArn: TopicArn,
    Endpoint: email
  };

  try {
    await SNS.subscribe(params).promise();
    console.log(`Subscription request sent to ${email}. They must confirm the subscription.`);
  } catch (error) {
    console.error(`Error subscribing ${email} to the topic`, error);
    throw new Error('Error subscribing email');
  }
};

const sendEmailNotification = async (email, financialMetrics) => {
  const message = `Here are your financial metrics: Net Worth - ${financialMetrics.netWorth}, DTI - ${financialMetrics.dti}, Savings Rate - ${financialMetrics.savingsRate}.`;
  const params = {
    Message: message,
    Subject: "Your Financial Metrics",
    TopicArn: TopicArn
  };

  try {
    await SNS.publish(params).promise();
    console.log(`Email sent to ${email}`);
  } catch (error) {
    console.error(`Error sending email to ${email}`, error);
    throw new Error('Error sending email');
  }
};

async function analyzeImage(bucketName, fileKey) {
  const params = {
    Document: {
      S3Object: {
        Bucket: bucketName,
        Name: fileKey,
      },
    },
  };
  
  const result = await textract.detectDocumentText(params).promise();
  return result;
}

function calculateTotal(financialData) {
  return Object.values(financialData).reduce((acc, value) => acc + value, 0);
}

async function saveToDynamoDB(email, financialData, financialMetrics) {
  
  const totalPortfolioAmount = calculateTotal(financialData);

  
  const itemToSave = {
    id: uuidv4(),
    email,
    ...financialData,
    totalPortfolioAmount,
    financialMetrics,
    timestamp: Date.now(),
  };

  const params = {
    TableName,
    Item: itemToSave,
  };

  await dynamoDb.put(params).promise();
}





