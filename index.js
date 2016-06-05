'use strict';
let exec = require('child_process').exec;
let s3 = require('s3');
let fs = require('fs');
let AWS = require('aws-sdk');


let awsSecretAccessKey = "";
let awsAccessKeyId = "";
let region = "us-west-2";
let bucket = "ngdeploy";
let key = "Dump/temp.tar";
let gitBranch = "master";
let gitAccessToken = "";
let gitOrganization= "mbejda";
let gitRepo = "";
let gitCloneCommand = "git clone -b "+gitBranch+" --depth=1 https://"+gitAccessToken+"@github.com/"+gitOrganization+"/"+gitRepo+" .";




exports.handler = (event, context, callback) => {
    /*
     Set variables
     */
    process.env['HOME'] = process.env['HOME'] || "/tmp";
    process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT'] + '/bin';
    process.env['aws_secret_access_key'] = awsSecretAccessKey;
    process.env['aws_access_key_id'] = awsAccessKeyId;
    process.env['region'] = region;

    /*
     Initiate our highlevel S3 client
     */
    let s3Client = s3.createClient({
        maxAsyncS3: 20,
        s3RetryCount: 3,
        s3RetryDelay: 1000,
        multipartUploadThreshold: 20971520,
        multipartUploadSize: 15728640,
        s3Options: {
            accessKeyId: process.env['aws_access_key_id'],
            secretAccessKey: process.env['aws_secret_access_key'],
            region: process.env['region'],
        }
    });


    /*
     We need write permissions in for temp directory
     */
    let cmd = "mkdir /tmp/temp; chmod 755 /tmp/temp";
    const chmod = exec(cmd, (error) => {
            if (error) return callback(error);



    const git = exec(gitCloneCommand, {
            cwd: "/tmp/temp"
        }, (error) => {
            if (error) return callback(error);


    /*
     Download bower dependencies
     */

    const bower = exec(process.env['LAMBDA_TASK_ROOT'] + "/node_modules/bower/bin/bower install --config.interactive=false", {
            cwd: "/tmp/temp"
        }, (error) => {
            if (error) return callback(error);



    /*

     Compress all of the files along with the dependencies
     */
    const tar = exec("tar czf temp.tar temp/*", {
            cwd: "/tmp"
        }, (error) => {
            if (error) return callback(error);




    /*
     Upload files to S3 bucket
     */
    let params = {
        localFile: "/tmp/temp.tar",
        s3Params: {
            Bucket: bucket,
            Key: key,
        },
    };



    let uploader = s3Client.uploadFile(params);
    uploader.on('error', function(err) {
        callback(err.stack);
    });
    uploader.on('progress', function() {
        console.log("progress", uploader.progressAmount, uploader.progressTotal);
    });
    uploader.on('end', function() {
        console.log("done uploading");
        callback(null, 'Process complete!');
    });
})


});


    bower.stdout.on('bower data', console.log);
    bower.stderr.on('bower data', console.error);
});


    git.stdout.on('git data', console.log);
    git.stderr.on('git data', console.error);

});


};