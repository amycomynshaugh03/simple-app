import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";

export class SimpleAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

  
    const moviesTable = new dynamodb.Table(this, "MoviesTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, 
    });

    
    const simpleFn = new lambdanode.NodejsFunction(this, "SimpleFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/simple.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
    });


    const getMovieByIdFn = new lambdanode.NodejsFunction(
      this,
      "GetMovieByIdFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: `${__dirname}/../lambdas/getMovieById.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: moviesTable.tableName,
          REGION: cdk.Aws.REGION,
        },
      }
    );

    const getMovieByIdURL = getMovieByIdFn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ["*"],
      },
    });

    moviesTable.grantReadData(getMovieByIdFn);

    new cdk.CfnOutput(this, "GetMovieByIdUrl", {
      value: getMovieByIdURL.url,
    });

    const getAllMoviesFn = new lambdanode.NodejsFunction(this, "GetAllMoviesFn", {
  architecture: lambda.Architecture.ARM_64,
  runtime: lambda.Runtime.NODEJS_18_X,
  entry: `${__dirname}/../lambdas/getAllMovies.ts`,
  timeout: cdk.Duration.seconds(10),
  memorySize: 128,
  environment: {
    TABLE_NAME: moviesTable.tableName,
    REGION: cdk.Aws.REGION,
  },
});

const getAllMoviesURL = getAllMoviesFn.addFunctionUrl({
  authType: lambda.FunctionUrlAuthType.NONE,
  cors: {
    allowedOrigins: ["*"],
  },
});

moviesTable.grantReadData(getAllMoviesFn);

new cdk.CfnOutput(this, "Get All Movies Function Url", {
  value: getAllMoviesURL.url,
});


  }
}
