/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


var collectionName = 'products';

var simpletable = new Schema({
    id: {type: Schema.Types.ObjectId},
    name: {type: String},
    cost: {type: Number},
}, {
    timestamps: true,
    versionKey: false
});

module.exports = mongoose.model(collectionName, simpletable, collectionName);