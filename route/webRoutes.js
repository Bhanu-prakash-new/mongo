var controllers = require('../Controllers/index');

/*
 * E-commerce product
*/
app.post('/web/createRow', controllers.table.addRow);
app.get('/web/get', controllers.table.sendRows);

app.post('/web/createprouduct', controllers.table.addTheProduct);
app.get('/web/getprouducts', controllers.table.sendProducts);

app.post('/web/addtocart', controllers.table.addToCart);
app.post('/web/getcartlist', controllers.table.getuserCart);
