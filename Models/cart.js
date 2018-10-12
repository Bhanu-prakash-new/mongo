var collectionName = 'cart';

var simpletable = new Schema({
    id: {type: Schema.Types.ObjectId},
    productid: {type: Schema.Types.ObjectId,ref:'products'},
    userid: {type: String},
}, {
    timestamps: true,
    versionKey: false
});

module.exports = mongoose.model(collectionName, simpletable, collectionName);