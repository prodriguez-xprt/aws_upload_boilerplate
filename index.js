require('dotenv/config')

const express = require('express')
const multer = require('multer')
const AWS = require('aws-sdk')
const uuid = require('uuid/v4')
const fs = require('fs')
const app = express()
const port = 3000
const path = require("path");
const { createWriteStream } = require("fs");


const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ID,
    secretAccessKey: process.env.AWS_SECRET
})

const storage = multer.memoryStorage({
    destination: function(req, file, callback) {
        callback(null, '')
    }
})

const upload = multer({storage}).single('image')

app.post('/upload',upload,(req, res) => {

    let myFile = req.file.originalname.split(".")
    const fileType = myFile[myFile.length - 1]

    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${uuid()}.${fileType}`,
        Body: req.file.buffer
    }

    s3.upload(params, (error, data) => {
        if(error){
            res.status(500).send(error)
        }

        res.status(200).send(data)
    })
})

app.get('/download', async function(req, res){

    var fileKey = `5c8b16de-4289-4324-a7fa-5a73df4fd5fc.pdf`;

    console.log('Trying to download file', fileKey);

    var options = {
        Bucket    : process.env.AWS_BUCKET_NAME,
        Key    : fileKey,
    };

    res.attachment(fileKey);

    await new Promise((res) =>
        s3.getObject(options).createReadStream()
          .pipe(
            createWriteStream(
              path.join(__dirname, "/tmp", "5c8b16de-4289-4324-a7fa-5a73df4fd5fc.pdf")
            )
          )
          .on("close", res)
      );

    var fileStream = s3.getObject(options).createReadStream();
    fileStream.pipe(res);
});

app.get('/s3Proxy', function(req, res, next){
    // download the file via aws s3 here
    var fileKey = `5c8b16de-4289-4324-a7fa-5a73df4fd5fc.pdf`;

    console.log('Trying to download file', fileKey);

    var options = {
        Bucket    : process.env.AWS_BUCKET_NAME,
        Key    : fileKey,
    };

    res.attachment(fileKey);
    var fileStream = s3.getObject(options).createReadStream();
    fileStream.pipe(res);
});

app.listen(port, () => {
    console.log(`Server is up at ${port}`)
})
