const aws = require('aws-sdk')


module.exports = async function readS3Files(nric){
    s3 = new aws.S3({
        credentials: {
       accessKeyId: process.env.AWS_ACCESS_KEY_ID,
       secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
   }, region: process.env.AWS_REGION});
   const params = { 
       Bucket:process.env.S3_BUCKET,
       Key: `cbm/${nric}.xml`,
   }
   const response = await s3.getObject(params).promise()
//    console.log('response', response.Body.toString());
   return response.Body.toString()
}