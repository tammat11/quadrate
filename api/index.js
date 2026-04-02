const { requestListener } = require('../server.js');

module.exports = async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const overriddenPathname = url.searchParams.get('__pathname');
    if (overriddenPathname) {
        url.searchParams.delete('__pathname');
        const nextQuery = url.searchParams.toString();
        req.url = `${overriddenPathname}${nextQuery ? `?${nextQuery}` : ''}`;
    }
    return requestListener(req, res);
};
