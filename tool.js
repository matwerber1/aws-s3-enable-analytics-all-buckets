const aws = require('aws-sdk');
const s3 = new aws.S3();

// UPDATE AS NEEDED
const report_prefix = 's3_analytics'
const report_bucket = 'werberm-s3-tests-logs';
//const analytics_log_bucket_account_id = "999999999999";

//#https://docs.aws.amazon.com/general/latest/gr/rande.html#s3_region

async function main() {
  
  var report_destination_region = await getBucketRegion(report_bucket);
  // the async is also helpful for avoiding throttling limits
  var listBucketsResponse = await s3.listBuckets().promise();

  await asyncForEach(listBucketsResponse.Buckets, async (bucket) => {
    var bucket_region = await getBucketRegion(bucket.Name);
    if (bucket_region !== report_destination_region) {
      console.log(
        `Bucket ${bucket.Name} (${bucket_region}) must be in same region as reporting `
        + `bucket ${report_bucket} (${report_destination_region})for delivery of S3 `
        + `analytics. Skipping analytics config...\n`
      );
    }
    else {
      await EnableS3Analytics(bucket.Name);
    }
  });

}


async function getBucketRegion(bucket) {

  var getLocationResponse = await s3.getBucketLocation({ Bucket: bucket }).promise();
  var bucket_region = getLocationResponse.LocationConstraint;

  // Some "LocationConstraints" do not map 1-to-1 to the typical region codes we are familiar with:
  // https://docs.aws.amazon.com/general/latest/gr/rande.html#s3_region
  switch (bucket_region) {
    case "":
      bucket_region = 'us-east-1';
      break;
    case "EU":
      bucket_region = 'eu-west-1';
      break;    
  }
  return bucket_region;
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

async function EnableS3Analytics(target_bucket) {

  var analytics_config_id = 'analytics-config';
  var target_bucket_arn = `arn:aws:s3:::${target_bucket}`;
  var report_bucket_arn = `arn:aws:s3:::${report_bucket}`;
  var full_prefix = `${report_prefix}/bucket=${target_bucket}`;

  var params = {
    AnalyticsConfiguration: { 
      Id: analytics_config_id,
      StorageClassAnalysis: { 
        DataExport: {
          Destination: { 
            S3BucketDestination: { 
              Bucket: report_bucket_arn,
              Format: "CSV",
              //BucketAccountId: analytics_log_bucket_account_id,
              Prefix: full_prefix
            }
          },
          OutputSchemaVersion: "V_1"
        }
      },
      // by excluding filter, all objects are included
      /*
      Filter: {
        And: {
          Prefix: 'STRING_VALUE',
          Tags: [
            {
              Key: 'STRING_VALUE', 
              Value: 'STRING_VALUE'
            },
  
          ]
        },
        Prefix: 'STRING_VALUE',
        Tag: {
          Key: 'STRING_VALUE', 
          Value: 'STRING_VALUE'
        }
      }
      */
    },
    Bucket: target_bucket,
    Id: analytics_config_id
  };

  console.log(`Putting analytics config for bucket ${target_bucket_arn}`);
  response = await s3.putBucketAnalyticsConfiguration(params).promise();
  console.log('Put successful\n');
  return;
}


(async () => {
    try {
        await main();
    }
    catch (e) {
        console.log("Unhandled error: " + e);
    }
})();