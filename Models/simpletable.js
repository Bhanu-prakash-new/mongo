

var collectionName = 'user';

var simpletable = new Schema({
    id: {type: Schema.Types.ObjectId},
    name: {type: String},
    description: {type: String},
    images: {
        fileName: {type: String},
        fileSize: {type: String},
        folderName: {type: String}
    },
}, {
    timestamps: true,
    versionKey: false
});

module.exports = mongoose.model(collectionName, simpletable, collectionName);