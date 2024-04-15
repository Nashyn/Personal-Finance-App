const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid'); 
const serverless = require('serverless-http');
const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());
app.use(express.json());

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const SNS = new AWS.SNS();
const TableName = 'taxInformation';
const TopicArn = process.env.TAX_NOTIFICATION_TOPIC_ARN;

const taxBrackets = {
  'Alberta': [
    { threshold: 148269, rate: 0.10 },
    { threshold: 177922, rate: 0.12 },
    { threshold: 237230, rate: 0.13 },
    { threshold: 355845, rate: 0.14 },
    { threshold: Infinity, rate: 0.15 }
  ],
  'British Columbia': [
    { threshold: 47937, rate: 0.0506 },
    { threshold: 95875, rate: 0.077 },
    { threshold: 110076, rate: 0.105 },
    { threshold: 133664, rate: 0.1229 },
    { threshold: 181232, rate: 0.147 },
    { threshold: 252752, rate: 0.168 },
    { threshold: Infinity, rate: 0.205 }
  ],
  'Manitoba': [
    { threshold: 47000, rate: 0.108 },
    { threshold: 100000, rate: 0.1275 },
    { threshold: Infinity, rate: 0.174 }
  ],
  'New Brunswick': [
    { threshold: 49958, rate: 0.094 },
    { threshold: 99916, rate: 0.14 },
    { threshold: 185064, rate: 0.16 },
    { threshold: Infinity, rate: 0.195 }
  ],
  'Newfoundland and Labrador': [
    { threshold: 43198, rate: 0.087 },
    { threshold: 86395, rate: 0.145 },
    { threshold: 154244, rate: 0.158 },
    { threshold: 215943, rate: 0.178 },
    { threshold: 275870, rate: 0.198 },
    { threshold: 551739, rate: 0.208 },
    { threshold: 1103478, rate: 0.213 },
    { threshold: Infinity, rate: 0.218 }
  ],
  'Northwest Territories': [
    { threshold: 50597, rate: 0.059 },
    { threshold: 101198, rate: 0.086 },
    { threshold: 164525, rate: 0.122 },
    { threshold: Infinity, rate: 0.1405 }
  ],
  'Nova Scotia': [
    { threshold: 29590, rate: 0.0879 },
    { threshold: 59180, rate: 0.1495 },
    { threshold: 93000, rate: 0.1667 },
    { threshold: 150000, rate: 0.175 },
    { threshold: Infinity, rate: 0.21 }
  ],
  'Nunavut': [
    { threshold: 53268, rate: 0.04 },
    { threshold: 106537, rate: 0.07 },
    { threshold: 173205, rate: 0.09 },
    { threshold: Infinity, rate: 0.115 }
  ],
  'Ontario': [
    { threshold: 51446, rate: 0.0505 },
    { threshold: 102894, rate: 0.0915 },
    { threshold: 150000, rate: 0.1116 },
    { threshold: 220000, rate: 0.1216 },
    { threshold: Infinity, rate: 0.1316 }
  ],
  'Prince Edward Island': [
    { threshold: 32656, rate: 0.0965 },
    { threshold: 64313, rate: 0.1363 },
    { threshold: 105000, rate: 0.1665 },
    { threshold: 140000, rate: 0.18 },
    { threshold: Infinity, rate: 0.1875 }
  ],
  'Saskatchewan': [
    { threshold: 52057, rate: 0.105 },
    { threshold: 148734, rate: 0.125 },
    { threshold: Infinity, rate: 0.145 }
  ],
  'Yukon': [
    { threshold: 55867, rate: 0.064 },
    { threshold: 111733, rate: 0.09 },
    { threshold: 173205, rate: 0.109 },
    { threshold: 500000, rate: 0.128 },
    { threshold: Infinity, rate: 0.15 }
  ]
};


const calculateCanadianTax = (totalIncome, province) => {
  let tax = 0;
  let remainingIncome = totalIncome;

  const brackets = taxBrackets[province] || [];
  for (let i = 0; i < brackets.length; i++) {
    const { threshold, rate } = brackets[i];
    if (remainingIncome > threshold) {
      tax += (i === 0 ? threshold : (threshold - brackets[i - 1].threshold)) * rate;
    } else {
      tax += (i === 0 ? remainingIncome : (remainingIncome - brackets[i - 1].threshold)) * rate;
      break;
    }
  }

  return tax;
};



const storeDataInDynamoDB = async (email, income, tax) => {
    const params = {
      TableName,
      Item: {
        id: uuidv4(),
        email,
        income,
        tax,
        timestamp: Date.now()
      }
    };
  
    try {
      await dynamoDb.put(params).promise();
      console.log('Data stored successfully in DynamoDB');
    } catch (error) {
      console.error('Error storing data in DynamoDB', error);
      throw new Error('Error storing data');
    }
  };

  const subscribeToTopic = async (email) => {
    const params = {
      Protocol: 'email',
      TopicArn,
      Endpoint: email
    };
  
    try {
      const subscribeResult = await SNS.subscribe(params).promise();
      console.log(`Subscription request sent to ${email}. They must confirm the subscription.`);
      return subscribeResult.SubscriptionArn;
    } catch (error) {
      console.error(`Error subscribing ${email} to the topic`, error);
      throw new Error('Error subscribing email');
    }
  };

  const sendEmailNotification = async (email, taxDetails) => {
    const message = `Hello, here are your tax details:\n` +
      `Total Income: ${taxDetails.totalIncome}\n` +
      `Total Tax: ${taxDetails.totalTax}\n` +
      `After Tax Income: ${taxDetails.afterTaxIncome}`;
  
    const params = {
      Subject: 'Your Tax Calculation',
      Message: message,
      TopicArn
    };
  
    try {
      await SNS.publish(params).promise();
      console.log(`Email sent to ${email}`);
    } catch (error) {
      console.error(`Error sending email to ${email}`, error);
      throw new Error('Error sending email');
    }
  };



    app.get('/calculate-tax', async (req, res) => {
        try {
          console.log(req.query);
          const {email, province, employmentIncome, selfEmploymentIncome, otherIncome, rrspContribution, capitalGains, eligibleDividends}= req.query;
          //const { email, province, employmentIncome, selfEmploymentIncome, otherIncome, rrspContribution, capitalGains, eligibleDividends } = req.body;
          

         
          const totalIncome = Number(employmentIncome) +
          Number(selfEmploymentIncome) +
          Number(otherIncome) +
          Number(capitalGains) +
          Number(eligibleDividends) -
          Number(rrspContribution || 0);

          const totalTax = calculateCanadianTax(totalIncome, province);
          const afterTaxIncome = totalIncome - totalTax;
      
        
          await storeDataInDynamoDB(email, totalIncome, totalTax);
      
          
          await subscribeToTopic(email);
          await sendEmailNotification(email, {
            province,
            totalIncome,
            totalTax,
            afterTaxIncome
          });
      
          res.status(200).json({
            message: 'Tax calculation successful',
            taxDetails: {
              province,
              totalIncome,
              totalTax,
              afterTaxIncome
            }
          });
        } catch (error) {
          console.error('Tax calculation error:', error);
          res.status(500).json({ error: 'An error occurred during tax calculation' });
        }
      });
// const PORT = 3000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

module.exports.handler = serverless(app);