// docker run -d \
//   --name mongodb-root \
//   -p 27017:27017 \
//   -e MONGO_INITDB_ROOT_USERNAME=root \
//   -e MONGO_INITDB_ROOT_PASSWORD=root \
//   mongo:latest
// mongodb://root:root@localhost:27017/?authSource=admin

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));
