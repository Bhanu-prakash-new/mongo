
console.log(process.env.mongo_server ,'mongodb://localhost:27017/sampletable')
mongoose.connect('mongodb://localhost:27017/sampletable', {
    useNewUrlParser: true,
});

