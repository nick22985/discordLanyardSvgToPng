const axios = require('axios');
const express = require('express');
const { Readable } = require('stream');

const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
require('dotenv').config();
const debug = require('debug');
debug.enable('*:error,*:warn,*:info,*:log' + (process.env.DEBUG ? ',' + process.env.DEBUG : ''));

const $debug = debug('svgToPng:server');

//Express Server
const app = express();
const port = process.env.PORT || 9995;

const http = require('http');
const server = http.createServer(app);
app.use(bodyParser.json());

app.get('/discordProfile/:id', async (req, res) => {
	try {
		$debug.extend('info')('Request received');
		const id = req.params.id;
		const url = `https://lanyard-profile-readme.vercel.app/api/${id}?&animated=true&hideDiscrim=false`;
		const response = await axios.get(url);

		const svg = response.data;

		// launch a headless instance of Chromium using puppeteer
		const browser = await puppeteer.launch({ headless: true });

		// create a new page using puppeteer
		const page = await browser.newPage();

		// set the size of the viewport to match the dimensions of the SVG image
		await page.setViewport({
			width: 425,
			height: 225,
			deviceScaleFactor: 1,
		});

		// use page.setContent() to load the SVG data into the page
		await page.setContent(svg, { waitUntil: 'networkidle0' });
		// use page.screenshot() to capture a screenshot of the page, and save it as a PNG
		const screenshot = await page.screenshot({ type: 'png', omitBackground: true });

		// close the puppeteer browser
		await browser.close();

		// convert the Buffer object to a Readable stream
		const stream = new Readable();
		stream.push(screenshot);
		stream.push(null);
		// send back with express
		res.set('Content-Type', 'image/png');
		res.set('Cache-Control', 'no-store');
		res.set('Pragma-directive: no-store');
		res.set('Cache-directive: no-store');
		res.set('Pragma: no-store');
		res.set('Expires: 0');
		res.set('');
		// set headers
		stream.pipe(res);
	} catch (error) {
		$debug.extend('error')(error);
		res.status(500).send('Something broke!');
	}
});

app.get('/', (req, res) => {
	res.send('Oh Hi There!');
});

server.listen(port, () => $debug.extend('info')(`Listening on port ${port}`));
