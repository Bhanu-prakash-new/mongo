/**
 * This is the sns(simple notification service) class.
 * It contains all the methods with promises of sns
 * @class snsHelper
 */

var AWS = require('aws-sdk');
var asyncLoop = require('node-async-loop');
var androidArn = process.env.android_arn;
var iosDevArn = process.env.ios_dev_arn;
var iosDistArn = process.env.ios_dist_arn;

var iosType = process.env.ios_type;
var iosArn;
if (iosType == 'dev') {
    iosArn = iosDevArn;
} else {
    iosArn = iosDistArn;
}


var awsConfig = {
    accessKeyId: process.env.aws_access_key,
    secretAccessKey: process.env.aws_secret_key,
    region: process.env.aws_region_key
};

AWS.config.update(awsConfig);
var sns = new AWS.SNS();

module.exports = {

    /**
     * Action for creating platform endPoint for SNS
     *
     * @method createPlatformEndpoint
     * @param {string} deviceToken - device token
     * @param {string} deviceType - type of device Ex: ios or android
     * @return {promise} res - If SNS function is sucess then it resolves end point ARN otherwise rejects some error.
     */

    createPlatformEndpoint: function (deviceToken, deviceType) {
        return new Promise(function (resolve, reject) {
            var platformArn;
            if (deviceType == 'ios') {
                platformArn = iosArn;
            } else {
                platformArn = androidArn;
            }
            var params = {
                PlatformApplicationArn: platformArn,
                Token: deviceToken,
                Attributes: {
                    Enabled: 'true',
                    Token: deviceToken,
                },
            };
            sns.createPlatformEndpoint(params, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    var endpointArn = data.EndpointArn;
                    resolve(endpointArn);
                }
            });
        })
    },

    /**
     * Action for updating platform endPoint for SNS
     *
     * @method UpdatePlatformEndPoints
     * @param {req} request
     * @param {res} response
     * @return {promise} res - updating platform endPoint
     */

    // UpdatePlatformEndPoints: function(req, res) {

    //     var params = {
    //         Attributes: { /* required */
    //             '<String>': 'STRING_VALUE',
    //             /* '<String>': ... */
    //         },
    //         EndpointArn: 'STRING_VALUE' /* required */
    //     };
    //     sns.setEndpointAttributes(params, function(err, data) {
    //         if (err) {
    //             console.log(err, err.stack); // an error occurred 
    //         } else {
    //             console.log(data); // successful response
    //         }
    //     });


    // },

    /*
    * Action for publishing notifications
    *
    * @method publishNotification
    * @param {string} subject - request
    * @param {string} message - message
    * @param {string} targetArn - targetArn of the user
    * @param {string} topicArn - topicArn
    * @param {string} publishType - publish type
    * @param {string} deviceType - type of device, Ex: ios or android
    * @param {string} receiverUserId - id of the received user
    * @param {string} modules - modules, Ex: bubHub, bubTalk
    * @param {string} notificationType - type of notification, Ex: bubHubLike
    * @param {string} userId - id of the user
    * @param {string} userName - name of the user
    * @param {object} userImage - image of the user
    * @param {string} deviceActiveStatus - status of the device
    * @param {string} parentId - id of the data(notification send on this data)  
    * @param {object} bubTalkDetails - all the details of bubTalk 
    * @return {promise} res - If query function is sucess then it resolves saved data otherwise rejects some error.
    */

    publishNotification: function(subject, message, targetArn, topicArn, publishType, deviceType,receiverUserId,modules,notificationType,userId,userName,userImage,deviceActiveStatus,parentId,bubTalkDetails,isSave) {
        return new Promise(function(resolve, reject) {
            
            if(typeof userId != 'undefined') {userId = userId}else{userId = '';}
            if(typeof userName != 'undefined') {userName = userName}else{userName = '';}
            if(typeof userImage != 'undefined') {userImage = userImage}else{userImage = '';}
            if(typeof parentId != 'undefined') {parentId = parentId}else{parentId = '';}
            if(typeof bubTalkDetails != 'undefined') {bubTalkDetails = bubTalkDetails}else{bubTalkDetails = {};}
            var isSaved = true;
            if( typeof isSave != "undefined" ) {
                isSaved = isSave;
            }
            var gcmDataArray = { data: { message: message, type : notificationType,modules : modules,parentId : parentId,bubTalkDetails:bubTalkDetails,sound: 'general_notification' } };
            var apnsDataArray = { aps: { alert: message, type : notificationType,modules:modules,parentId : parentId,bubTalkDetails:bubTalkDetails,sound: 'general_notification.wav','content-available': 1 } };


            var msgArray = {
                default: message,
            };

            if (subject == '') {
                subject = 'Petbubs';
            }

            var params = {
                MessageStructure: 'json',
                Subject: subject,
            };

            if (publishType == 'topic') {

                if (iosType == 'dev') {
                    msgArray.APNS_SANDBOX = JSON.stringify(apnsDataArray);
                } else {
                    msgArray.APNS = JSON.stringify(apnsDataArray);
                }
                msgArray.GCM = JSON.stringify(gcmDataArray);

                params.TopicArn = topicArn;

                params.Message = JSON.stringify(msgArray);
                
                /*publish notifications on topic*/
                sns.publish(params, function (err, data) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                });
            } else {
                var i = 0;
                asyncLoop(targetArn, function (item, next) {
                    params.TargetArn = item;
                    var deviceTypeItem = '';
                    var deviceActStatus = '';

                    if (typeof deviceType[i] != 'undefined') {
                        deviceTypeItem = deviceType[i];
                    }
                    if (typeof deviceActiveStatus[i] != 'undefined') {
                        deviceActStatus = helper.checkNotificationStatus(deviceActiveStatus[i],modules);
                    }

                    i++;
                    if (deviceTypeItem == 'ios') {
                        if (iosType == 'dev') {
                            msgArray.APNS_SANDBOX = JSON.stringify(apnsDataArray);
                        } else {
                            msgArray.APNS = JSON.stringify(apnsDataArray);
                        }
                    } else {
                        msgArray.GCM = JSON.stringify(gcmDataArray);
                    }
                    params.Message = JSON.stringify(msgArray);
                    if(deviceActStatus == true){
                        sns.publish(params, function() {
                            next();
                        });
                    } else {
                        next();
                    }

                }, function (error) {
                    if (error) {
                        reject(error);
                    } else if(isSaved == true) {
                        var logs = {
                            modules: modules,
                            notificationType: notificationType,
                            parentId: parentId,
                            message: message,
                            messageJson: msgArray,
                            receiverUserId: receiverUserId,
                            actionUserId: userId,
                            actionUserName: userName,
                            actionUserImage: userImage,
                            bubTalkDetails: bubTalkDetails
                        };
                        var logsData = new models.notificationLogs(logs);
                        _mongoose.save(logsData).then(function (data) {
                            resolve(data);
                        }).catch(function (error) {
                            reject(error);
                        });
                    } else {
                        resolve(true);
                    }
                });
            }
        });
    },

    /**
     * Action for Subscribe for a specific topic
     *
     * @method subscribe
     * @param {string} targetArn - target arn
     * @param {string} topicArn - topic arn
     * @return {promise} res - If SNS function is sucess then it resolves subscribe ARN otherwise rejects some error.
     */

    subscribe: function (targetArn, topicArn) {
        return new Promise(function (resolve, reject) {
            if (topicArn == '') {
                /*default topic to subscribe*/
                topicArn = process.env.petbubs_topic;
            }
            var params = {
                Protocol: 'application',
                TopicArn: topicArn,
                Endpoint: targetArn
            };
            sns.subscribe(params, function (err, data) {
                if (err) {
                    winston.log(err, err.stack);
                    reject(err);
                } else {
                    var SubscriptionArn = data.SubscriptionArn;
                    resolve(SubscriptionArn);
                }
            });
        });
    },

    /**
     * get details of endpoint
     *
     * @method unSubscribe
     * @param {req} requset
     * @param {res} response
     * @return {promise} res - UnSubscribe for a specific topic 
     */
    getTopicAttributes: function (topicArn) {
        return new Promise(function (resolve, reject) {
            var params = {
                TopicArn: topicArn
            };
            sns.getTopicAttributes(params, function (err, data) {
                if (err){
                    reject(err);
                }else{
                    resolve(data);
                }
            });
        });
    },

    /**
     * Action for UnSubscribe for a specific topic
     *
     * @method unSubscribe
     * @param {req} requset
     * @param {res} response
     * @return {promise} res - UnSubscribe for a specific topic 
     */

    unSubscribe: function (subscriptionArn) {
        return new Promise(function (resolve, reject) {
            var params = {
                SubscriptionArn: subscriptionArn
            };
            sns.unsubscribe(params, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    },
    
    getSubscriptionAttributes: function (subscriptionArn) {
        return new Promise(function (resolve, reject) {
            var params = {
                SubscriptionArn: subscriptionArn
            };
            sns.getSubscriptionAttributes(params, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    },

}
