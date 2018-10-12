/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


module.exports = {
    addRow: function (req, res) {
        var requiredParams = ['name', 'description'];
        helper.validateRequiredParams(req, res, requiredParams).then(function () {
            var postData = req.body;
            var appVersionSave = new db.user(postData);
            _mongoose.save(appVersionSave).then(function (appVersionData) {
                var response = {};
                response.data = appVersionData;
                helper.formatResponse(response, res, '');
            }).catch(function (error) {
                helper.formatResponse('', res, error);
            });
        });
    },
    sendRows: function (req, res) {
        db.user.find({}).then(function (data) {
            return res.json({
                success: true,
                data: data
            });
        }).catch(function (error) {
            return  res.send({sucess: false, error: error})
        });
    },
    sendProducts: function (req, res) {
        db.product.find({}).then(function (data) {
            return res.json({
                success: true,
                data: data
            });
        }).catch(function (error) {
            return  res.send({sucess: false, error: error})
        });
    },
    addTheProduct: function (req, res) {
        console.log(req.body, 'reqbody')
        var requiredParams = ['name', 'cost'];
        helper.validateRequiredParams(req, res, requiredParams).then(function () {
            var postData = req.body;
            var appVersionSave = new db.product(postData);
            _mongoose.save(appVersionSave).then(function (appVersionData) {
                var response = {};
                response.data = appVersionData;
                helper.formatResponse(response, res, '');
            }).catch(function (error) {
                helper.formatResponse('', res, error);
            });
        });
    },
    addToCart: function (req, res) {
        var postData = req.body;
        var appVersionSave = new db.cart(postData);
        _mongoose.save(appVersionSave).then(function (appVersionData) {
            var response = {};
            response.data = appVersionData;
            helper.formatResponse(response, res, '');
        }).catch(function (error) {
            helper.formatResponse('', res, error);
        });
    },
    getuserCart: function (req, res) {

//        db.cart.find({userid:req.body.id}).populate({path:"productid"}).then(function (data) {
        db.cart.aggregate([{$lookup: {from: "products", localField: "productid",foreignField: "_id",  as: "products"}}]).then(function (data) {
            return res.json({
                success: true,
                data: data
            });
        }).catch(function (error) {
            return  res.send({sucess: false, error: error})
        });
    }
}