const puppeteer = require('puppeteer');
const SpotifyWebApi = require('spotify-web-api-node');
require('dotenv').config();
const fs = require('fs');
var targetPlaylistId = `5qJwKZZ3AYXl28lqDNntqR`;
var songList = [];
var num = 0;
// credentials are optional
var spotifyApi = new SpotifyWebApi({
    clientId: 'fcecfc72172e4cd267473117a17cbd4d',
    clientSecret: 'a6338157c9bb5ac9c71924cb2940e1a7'
  });

spotifyApi.clientCredentialsGrant().then(
    function(data) {
      console.log('The access token expires in ' + data.body['expires_in']);
      console.log('The access token is ' + data.body['access_token']);
  
      // Save the access token so that it's used in future calls
      spotifyApi.setAccessToken(data.body['access_token']);
    },
    function(err) {
      console.log('Something went wrong when retrieving an access token', err);
    }
);



const accessToken = "BQD-vJVbNtC2kVO5-vxBX9OL4OFFSsVp2kheSbPUg-IieDeVK0u92qS4nVnpy1RHVIMr3geuu8VmvoyuW9hmSAhKebOVRTZhrUd4jxB03XEkp-OE0U3RePr3o7cFODP7qchY5IMtY_PQvoph316PXhX26Ymh_Se1JPvCKMmTW88QS_KIwiO9IqNntuBXfn3V715MFbpzNoYZ9CCVzcLZPaEPEY5dmCleSmE5VNRoQiNosMExWyBHYGyjV2OFjazIIyEskf4Kdfqw41Fa5ljLxulp";
spotifyApi.setAccessToken(accessToken)

//Get totalTrackLoop
const totalTrackLoop = async (targetPlaylistId) => {
    try {
        const data = await spotifyApi.getPlaylistTracks(targetPlaylistId, {
          offset: 1,
          limit: 1,
          fields: 'total'
        });
        let loop = Math.ceil(data.body.total/100);
        let reminder = (data.body.total/100).toString().split(".")[1];
        return {"loopTime":loop,"reminder": reminder};

      } catch (err) {
        console.log('Something went wrong!', err);
        return 0;
      }
}



// Get a playlist
async function getPlaylist(targetPlaylistId) {
    try {
      const {loopTime,reminder} = await totalTrackLoop(targetPlaylistId);
      for(i = 1; i <= loopTime; i++){
        let limit = i === loopTime ? reminder : 100;
        const data = await spotifyApi.getPlaylistTracks(targetPlaylistId, {
            offset: (i-1)*100,
            limit: limit,
            fields: 'items,total'
          });
          //console.log(data.body.items);
          data.body.items.forEach(element => {
            const trackItem = element.track;
            const trackName = trackItem.name;
            const trackArtists = trackItem.artists;
            num++;
            let artistName = ""
            if(trackArtists.length > 1){
                trackArtists.forEach(element => {
                    artistName = artistName === "" ? element.name: `${artistName} ${element.name}`;
                })
                //console.log(trackItem.artists)
            }
            else{
                artistName = trackArtists[0].name;
            }
            console.log(`${num}: ${trackName} ${artistName}`);

            songList.push(`${trackName} ${artistName}`);
          });
      }

      const filePath = 'tracks.txt';

      // Convert array to a string with each element on a new line
      const data = songList.join('\n');

      // Write data to a new file
      fs.writeFile(filePath, data, (err) => {
          if (err) throw err;
          console.log('The file has been created and saved!');
      });

    } catch (err) {
      console.log('Something went wrong!', err);
    }
  }




  const readline = require('readline');
  const { google } = require('googleapis');
  
  const SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl'];
  const TOKEN_PATH = 'token.json'; // Local file to store tokens after authorization
  const REDIRECT_URI = 'https://google.com.au'; // Manually specify the redirect URI
  
  /**
   * Initializes the process of creating a YouTube playlist.
   */
  function initCreatePlaylist() {
    // Load client secrets from a local file.
    fs.readFile('credentials.json', (err, content) => {
      if (err) return console.log('Error loading client secret file:', err);
      authorize(JSON.parse(content), createPlaylist);
    });
  }
  
  /**
   * Create an OAuth2 client with the given credentials, and then execute the
   * given callback function.
   * @param {Object} credentials The authorization client credentials.
   * @param {function} callback The callback to call with the authorized client.
   */
  function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, REDIRECT_URI);
  
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) return getNewToken(oAuth2Client, callback);
      oAuth2Client.setCredentials(JSON.parse(token));
      callback(oAuth2Client);
    });
  }
  
  /**
   * Get and store new token after prompting for user authorization, and then
   * execute the given callback with the authorized OAuth2 client.
   * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
   * @param {function} callback The callback for the authorized client.
   */
  function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return console.error('Error retrieving access token', err);
        oAuth2Client.setCredentials(token);
        // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) return console.error(err);
          console.log('Token stored to', TOKEN_PATH);
        });
        callback(oAuth2Client);
      });
    });
  }
  
  /**
   * Creates a playlist in the authorized user's channel.
   * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
   */
  function createPlaylist(auth) {
    const service = google.youtube('v3');
    service.playlists.insert(
      {
        auth: auth,
        part: 'snippet,status',
        resource: {
          snippet: {
            title: 'SuperFicial',
            description: '',
          },
          status: {
            privacyStatus: 'public',
          },
        },
      },
      (err, response) => {
        if (err) {
          console.error('The API returned an error: ' + err);
          return;
        }
        console.log('Playlist created with ID:', response.data.id);
      }
    );
  }

  async function scrapeYouTubeMusic(query) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
  
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' "Auto-generated by YouTube"')}`;
    await page.goto(searchUrl);
  
    // Wait for the results to load
    await page.waitForSelector('ytd-video-renderer', { timeout: 60000 });
  
    const tracks = await page.evaluate(() => {
      const trackElements = document.querySelectorAll('ytd-video-renderer');
      const results = [];
  
      trackElements.forEach(track => {
        const titleElement = track.querySelector('#video-title');
        const title = titleElement ? titleElement.innerText : null;
        const url = titleElement ? `https://www.youtube.com${titleElement.getAttribute('href')}` : null;
        const descriptionElement = track.querySelector('#description-text');
        const description = descriptionElement ? descriptionElement.innerText : '';
        const viewsElement = track.querySelector('#metadata-line span:nth-child(1)');
        const views = viewsElement ? viewsElement.innerText : '';
        const uploadDateElement = track.querySelector('#metadata-line span:nth-child(2)');
        const uploadDate = uploadDateElement ? uploadDateElement.innerText : '';
  
        if (title && url) {
          results.push({ title, url, description, views, uploadDate });
        }
      });
  
      return results;
    });
  
    console.log(tracks);
  
    await browser.close();
  }
  
  const searchQuery = 'Stan Eminem Dido';  // Replace with your search query
  //scrapeYouTubeMusic(searchQuery);
  // Call the function to initiate the playlist creation process
  //initCreatePlaylist();
  // Call the function with the appropriate playlist ID
  //getPlaylist(targetPlaylistId);