const request = require('superagent');
const prefix = require('superagent-prefix')('https://api.github.com')

request
  .get('/repos/c-meier/HEIG-2017-PDG-WORDOFF/collaborators')
  .use(prefix)
  .end((err, res) => {
    // Calling the end function will send the request
    console.log(res);
  });
