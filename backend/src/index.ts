import express from 'express';
import bodyParser from 'body-parser';

const app = express();

app.use(bodyParser.json()); // body parsing the response

const port = Number(process.env.PORT ?? 5172);
const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(process.env.PORT);
});

export { server };
