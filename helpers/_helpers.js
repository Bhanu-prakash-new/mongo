    /**
    * This is the helper class.
    * It contains all the reuseful promise methods of validation and response 
    * @class helper
    */

var _sns = require('./_sns');
module.exports = {

    /**
    * Parse UserTags from string
    *
    * @method UserTags
    * @usage : helper.parseUserTags(string);   no further actions and promices
    * @param {object} businessData - Post and comment strings
    * @return {boolean} - user tags content
    */
    parseUserTags: function (string,modules,notificationType,parentId){
        var parseMentions = require('parse-mentions');
        var mentionObject = parseMentions(string);
        var mentionTags = mentionObject.matches;

        mentionTags.forEach(function(item){
            var tag = item.name;
            models.users.findOne({displayName : { $regex: new RegExp("^" + tag + '$', "i") }}).exec(function(err, displayData) {
                if(!_.isEmpty(displayData)){
                    var dbDisplayName = displayData.displayName;
                    /*send notification and add logs for bub hub section*/
                    common.bubHub.getNotificationDetailsFromDisplayName(dbDisplayName).then(function (createdByInfo){
                        var postId = parentId;
                        var actionUserId = requestUserId;
                        var receiverUserId = createdByInfo[0]._id;
                        var targetArn = createdByInfo[0].targetArn;
                        var deviceType = createdByInfo[0].deviceType;
                        //var deviceActiveStatus = createdByInfo[0].deviceActiveStatus;
                        var deviceActiveStatus = createdByInfo[0].notificationSetting;
                        
                        if(actionUserId != receiverUserId){
                            common.users.getUsersInfoForNotifications(actionUserId).then(function (usersInfo){
                                var userName = usersInfo[0].displayName;
                                var userId = usersInfo[0].userId;
                                var userImage = usersInfo[0].userImage;

                                var msgSuffix = '';
                                if(notificationType == 'bubHubComment'){
                                    msgSuffix = appMessage.bubHub.success.commentMention.msg;
                                }else if(notificationType == 'bubHubPost'){
                                    msgSuffix = appMessage.bubHub.success.postMention.msg;
                                }else if(notificationType == 'bubTalkThread'){
                                    msgSuffix = appMessage.bubTalk.success.threadMention.msg;
                                }else if(notificationType == 'bubTalkReplay'){
                                    msgSuffix = appMessage.bubTalk.success.replayMention.msg;
                                }else if(notificationType == 'bubTalkComment'){
                                    msgSuffix = appMessage.bubTalk.success.replayCommentMention.msg;
                                }

                                var message = userName+' '+msgSuffix;
                                if(modules == 'bubHub'){
                                    _sns.publishNotification('',message,targetArn,'','',deviceType,receiverUserId,modules,notificationType,userId,userName,userImage,deviceActiveStatus,parentId);
                                }else if(modules == 'bubTalk'){
                                    common.bubTalkTopic.getBubTalkThreadCreatedBy(parentId).then(function (createdByInfo){
                                        
                                        var themeColor = createdByInfo[0].themeColor    ;
                                        var topicId = createdByInfo[0].topicId;
                                        var catId = createdByInfo[0].catId;
                                        var threadId = parentId;
                                        var topicName = createdByInfo[0].topicName;
                                        parentId = '';
                                        
                                        var bubTalkDetails = {themeColor : themeColor,topicId : topicId,catId : catId,threadId : threadId,topicName:topicName};
                                        _sns.publishNotification('',message,targetArn,'','',deviceType,receiverUserId,modules,notificationType,userId,userName,userImage,deviceActiveStatus,parentId,bubTalkDetails);
                                    })
                                    
                                }
                                
                            })
                        }
                    })
                }
            });
        });
    },

    /**
    * Parse hashtags from string
    *
    * @method parseHashTags
    * @usage : helper.parseHashTags(string);   no further actions and promices
    * @param {object} businessData - Post and comment strings
    * @return {boolean} - hashTags content
    */
    parseHashTags: function (string){
        var findHashtags = require('find-hashtags');
        var hashArray = findHashtags(string);

        hashArray.forEach(function(item){
            var tagsData = {keywords : item,type : 'hashTags'};    
            var insertData = new models.hashTags(tagsData);
            _mongoose.save(insertData).then(function(outputData) {

            }).catch(function (error) {
                models.hashTags.findOne({keywords : item}).exec(function(err, data){
                    if(data){
                        var hashId = data._id;
                        var newCount = data.count+1;
                        var modelName = models.hashTags;
                        var condition = {_id : hashId};
                        var updateParams = {count : newCount};
                        _mongoose.update(modelName, condition, updateParams).then(function(countData) {})
                    }
                });
            }); 
        });
    },

    /**
    * Verify business row is not empty
    *
    * @method checkSheetRowEmpty
    * @param {object} businessData - business records
    * @return {boolean} - true for correct, false for error
    */
    checkSheetRowEmpty: function (businessData){
        var error = 0;
        _.forEach(businessData, function(value) {
            if(value == ''){
                error++;
            }
        });
        if(error == _.size(businessData)){
            return false;    
        }else{
            return true;
        }
    },

    /**
    * Action for send OTP
    *
    * @method sendOtp
    * @param {string} code - code of the country
    * @param {string} mobileNo - mobile number
    * @return {promise} res - After sending OTP It resolves data.If error it rejects the error.
    */
    sendOtp: function (code, mobileNo) {
        return new Promise(function (resolve, reject) {
            var message = "Welcome to PETBUBS.\n Your OTP is "+code+". Valid for 15 minutes.";
            var encodeMsg = encodeURIComponent(message);
            var smsUrl = "https://smsapi.24x7sms.com/api_2.0/SendSMS.aspx?APIKEY=tRaUgtgYYmL&MobileNo="+mobileNo+"&SenderID=PETBUB&Message="+encodeMsg+"&ServiceName=TEMPLATE_BASED";
            request.get(smsUrl,'',function(err,res,body){
                if(err){
                    reject(err);
                }else{
                    resolve(body);
                }
            }); 
        })
    },

    /**
    * Action for validating required params in body
    *
    * @method validateRequiredParams
    * @param {req} request
    * @param {res} response
    * @param {object} requiredParams - requiredParams
    * @return {promise} res - It returns error when missing some params in body
    * return ===> error = httpstatus 422, success = true.
    */

    validateRequiredParams: function (req, res, requiredParams) {
        return new Promise(function (resolve, reject) {
            var errorCount = 0;
            var missingParams = [];
            requiredParams.forEach(function (obj) {
                if (typeof req.body[obj] == 'undefined' || req.body[obj] == '') {
                    errorCount++;
                    missingParams.push(obj);
                }
            });
            if (errorCount > 0) {
                var error = {
                    success: false,
                    httpstatus: 422,
                    msg: 'Missing required parameters',
                    data: {
                        missingParams: missingParams
                    }
                };
                helper.formatResponse(error, res);
            } else {
                resolve({
                    success: true,
                    data: []
                });
            }

        })
    },
    
    /**
    * Action for formatting response
    *
    * @method formatResponse
    * @param {object} response
    * @param {res} response(It is used for giving response)
    * @param {object} error - error
    * @return {data} res -It returns json output format all error and success response to maintain common format.
    */

    formatResponse: function (response, res, error) {
        
        var httpstatus = 200;
        if (typeof response.httpstatus != 'undefined' && response.httpstatus != '') {
            httpstatus = response.httpstatus;
        }
        if (httpstatus != 200 && process.env.WINSON_ERROR_LOG == true) {
            winston.log('error', response);
        }
        var output = {};
        var successStatus;
        if (response !== '') {
            successStatus = true;
            output['success'] = successStatus;
            if (typeof response.msg != 'undefined' && response.msg != '') {
                var responseMessage = response.msg;
                output['msg'] = responseMessage;
            }
            if (typeof response.data != 'undefined' && response.data != '') {
                var responseData = response.data;
                output['data'] = responseData;
            }
        } else {
            successStatus = false;

            if (typeof error.httpstatus != 'undefined' && error.httpstatus != '') {
                httpstatus = error.httpstatus;
                delete error.httpstatus;
            } else {
                httpstatus = helper.getHttpStatusFromMongooseError(error.code);
            }
            output = {
                success: successStatus,
                msg: error.msg,
            }
        }
        
        res.status(httpstatus).json(output)
    },
    
    /**
    * Action for getting HttpStatus From MongooseError
    *
    * @method getHttpStatusFromMongooseError
    * @param {number} errorCode - errorCode
    * @return {code} res -It returns error code to get http status code from mongoose error code to maitain common format
    */
    
    getHttpStatusFromMongooseError: function (errorCode) {
        var codeLibrary = {};
        var code = '';
        codeLibrary = {
            '11000': 409
        };
        if ((typeof codeLibrary[errorCode] != 'undefined') && codeLibrary[errorCode] != '') {
            code = codeLibrary[errorCode];
        } else {
            code = 400; // default
        }
        return code;
    },
    
    /**
    * Action for getting unique field error
    *
    * @method parseUniqueFieldError
    * @param {number} errorCode - errorCode
    * @return {field} res -It returns error code to parse unique field name from moongose error syntex.
    */

    parseUniqueFieldError: function (errorCode) {
        var field = errorCode.message.split('index: ')[1];
        // now we have `keyname_1 dup key`
        field = field.split(' dup key')[0];
        field = field.substring(0, field.lastIndexOf('_')); // returns keyname
        return field;
    },
    
    /**
    * Action for checking admin role
    *
    * @method isAdmin
    * @param {string} userRole - role of the user
    * @return {status} res -If User role is admin then it returns true otherwise false.
    */

    isAdmin: function (userRole) {
        if (userRole == 'Admin') {
            return true;
        } else {
            return false;
        }
    },

    /**
    * Action for getting filename by spliting
    *
    * @method basename
    * @param {string} path - path of the file
    * @return {string} res - fileName,It returns original name of the file.
    */

    basename: function (path) {
        return path.split('/').reverse()[0];
    },

     
    /**
    * Checking notification status for sending to users
    *
    * @method checkNotificationStatus
    * @param {Object} notificationSetting - Object of user device status of each module
    * @param {String} module - Current Module
    * @return {Boolean} reuturn true of false
    */
    
    checkNotificationStatus: function (notificationSetting,module) {
        if(notificationSetting.bubHub && (module=='bubHub' || module=='follow')){
            return true;
        }else if(notificationSetting.bubTalk && module=='bubTalk'){
            return true;
        }else if(notificationSetting.petNews && module=='petNews'){
            return true;
        }else{
            return false;
        }
    }


}	