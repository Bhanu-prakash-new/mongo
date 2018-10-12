
    /**
    * This is the mongoose query class.
    * It contains all the query methods of mongoose
    * @class mongooseHelper
    */

module.exports = {
    
    /**
    * Action for saving the record into database
    *
    * @method save
    * @param {object} modelSchema - json object of the model
    * @return {promise} res - If query is sucess then it resolves inserted data otherwise rejects some error.
    */

    save: function (modelSchema) {
        return new Promise(function (resolve, reject) {
            modelSchema.save().then(function (schemaData) {
                resolve(schemaData);
            }).catch(function (error) {
                console.log(error);
                var errorMsg = {};
                if(!_.isEmpty(error)){
                    errorMsg = error.toJSON();
                }
                var errResponse = {};
                var httpstatus = '400'
                if (error.code == '11000') {
                    errorMsg.fieldName = helper.parseUniqueFieldError(error);
                    errorMsg.msg = helper.parseUniqueFieldError(error) + ' ' + appMessage.common.error.unique.msg;
                    httpstatus = '409'
                    errResponse = helper.parseUniqueFieldError(error) + ' ' + appMessage.common.error.unique.msg;
                }
                reject({
                    httpstatus: httpstatus,
                    msg: errResponse
                });
            });
        })
    },
    
    /**
    * Action for saving the bulk of records into database
    *
    * @method bulkSave
    * @param {string} modelName - name of the model
    * @param {object} modelData - JSON object of the model
    * @return {promise} res - If query is sucess then it resolves inserted data otherwise rejects some error.
    */

    bulkSave: function (modelName, modelData) {
        return new Promise(function (resolve, reject) {
            new models[modelName].insertMany(modelData).then(function (docs) {
                resolve({
                    data: docs
                });
            }).catch(function (err) {
                reject({
                    error: err
                });
            });
        })
    },

    /**
    * Action for finding the one record from the database
    *
    * @method findOne
    * @param {string} modelName - name of the model
    * @param {object} condition - condition
    * @param {array} fields - selected fields
    * @return {promise} res - If query is sucess then it resolves retrieved data otherwise rejects some error.
    */

    findOne: function (modelName, condition, fields) {
        return new Promise(function (resolve, reject) {
            var promise;
            if (fields !== '') {
                promise = modelName.findOne(condition).select(fields).exec();
            } else {
                promise = modelName.findOne(condition).exec();
            }

            promise.then(function (data) {
                if (data !== null) {
                    resolve({
                        data: data
                    });
                } else {
                    reject({
                        httpstatus: 404,
                        msg: "No records available"
                    });
                }
            }).catch(function (error) {
                reject({
                    error: error
                });
            });
        })
    },

    /**
    * Action for finding records from the database
    *
    * @method find
    * @param {string} modelName - name of the model
    * @param {object} condition - condition
    * @param {array} fields - selected fields
    * @return {promise} res - If query is sucess then it resolves retrieved data otherwise rejects some error.
    */

    find: function (modelName, condition, fields) {
        return new Promise(function (resolve, reject) {
            var promise;
            if (fields !== '') {
                promise = modelName.find(condition).select(fields).exec();
            } else {
                promise = modelName.find(condition).exec();
            }

            promise.then(function (data) {
                if (data !== null) {
                    resolve({
                        data: data
                    });
                } else {
                    reject({
                        httpstatus: 404,
                        msg: "No records available"
                    });
                }
            }).catch(function (error) {
                reject({
                    error: error
                });
            });
        })
    },
    
    /**
    * Action for updating the record in database
    *
    * @method update
    * @param {string} modelName - name of the model
    * @param {object} condition - condition
    * @param {object} updateParams - updateParams
    * @param {object} unsetParams - unsetParams
    * @return {promise} res - If query is sucess then it resolves updated data otherwise rejects some error.
    */
    
    update: function (modelName, condition, updateParams, unsetParams) {
    
        return new Promise(function (resolve, reject) {
            var setUnsetOption = {};
            if (typeof unsetParams != 'undefined' && !_.isEmpty(unsetParams)) {
                setUnsetOption = {$set: updateParams, $unset: unsetParams};
            } else {
                setUnsetOption = {$set: updateParams};
            }
            modelName.findOneAndUpdate(condition, setUnsetOption, {new : true},
                    function (error, data) {
                       if (error) {
                            reject({
                                error: error
                            });
                        } else {
                            if (data !== null) {
                                resolve({
                                    data: data
                                });
                            } else {
                                reject({
                                    httpstatus: 404,
                                    msg: error
                                });
                            }
                        }
                    });

        });
    },
    
    /**
    * Action for updating all records in database
    *
    * @method updateAll
    * @param {string} modelName - name of the model
    * @param {object} condition - condition
    * @param {object} updateParams - updateParams
    * @param {object} unsetParams - unsetParams
    * @return {promise} res - If query is sucess then it resolves updated data otherwise rejects some error.
    */

    updateAll: function (modelName, condition, updateParams, unsetParams) {
        return new Promise(function (resolve, reject) {
            var setUnsetOption = {};
            if (typeof unsetParams != 'undefined') {
                setUnsetOption = {$set: updateParams, $unset: unsetParams};
            } else {
                setUnsetOption = {$set: updateParams};
            }
            modelName.update(condition, setUnsetOption, {multi: true},
                    function (error, data) {
                        if (error) {
                            reject({
                                error: error
                            });
                        } else {
                            if (data !== null) {
                                resolve({
                                    data: data
                                });
                            } else {
                                reject({
                                    httpstatus: 404,
                                    msg: "No records available"
                                });
                            }
                        }
                    });

        });
    },

    /**
    * Action for delete the record in database
    *
    * @method update
    * @param {string} modelName - name of the model
    * @param {object} condition - condition
    * @return {promise} res - If query is sucess then it resolves deleted data otherwise rejects some error.
    */

    deleteHook: function (modelName, condition) {
        return new Promise(function (resolve, reject) {
            if (typeof modelName.getRelatedSchema == 'function') {
                modelName.getRelatedSchema(function (relatedCollection) {
                    modelName.findOne(condition).select().exec(function (err, doc) {
                        if (err) {
                            reject(err);
                        } else if(typeof doc != 'undefined' && doc !== null && doc != ''){
                            doc.remove(function (err, result) {
                                if (err) {
                                    reject(err);
                                } else {
                                    if (_.isEmpty(relatedCollection)) {
                                        reject(err);
                                    } else {
                                        _.forEach(relatedCollection, function (value) {
                                            var innerCondition = {};
                                            innerCondition[value.fieldName] = result._id;
                                            value.modelName.remove(innerCondition).exec();
                                        });
                                        resolve(doc);
                                    }
                                }
                            });
                        } else {
                            var error = {
                                httpstatus : 400,
                                msg : appMessage.common.error.badRequest.msg
                            }
                            reject(error);
                        }
                    });
                });
            } else {
                modelName.findOne(condition).select().exec(function (err, doc) {
                    if (err) {
                        reject(err);
                    } else if(typeof doc != 'undefined' && doc !== null && doc != ''){
                        doc.remove(function (err, result) {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(result);
                            }
                        });
                    } else {
                        var error = {
                            httpstatus : 400,
                            msg : appMessage.common.error.badRequest.msg
                        };
                        reject(error);
                    }
                });
            }
        });
    }
}