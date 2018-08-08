#Client Restaurant-review stage 3
Start from result of stage-2 and add functionalities requested for stage-3 workbox to manage service worker features.

#Install client
To install the client follow this procedure
1. install package dependency: got to client directory and run the commad
```
npm install
```
2. generate client site into dist directory. from client directory run the command:
```
gulp dist
gulp make
```
the second call gulp make it's necessary to build correctly the service worker using workbox-build plugin. I don't find the reason why when the task workbox-build-sw it's called in the dist sequence it fail.

3. run client site. From the dist directory run the command:
```
python -m http.server 8000
```

4. Run the server Rest API from the directory run the command:
```
node server
```
