const aws = require('aws-sdk')

function upload(file, nric){
    s3 = new aws.S3({
         credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }, region: process.env.AWS_REGION});
    const params = { 
        Bucket:process.env.S3_BUCKET,
        Key: `cbm/${nric}.xml`,
        Body: file,
    }

    return s3.upload(params, function(err, data){
        if(err) throw err
        console.log('file successfully uploaded');
    })

}

module.exports = upload