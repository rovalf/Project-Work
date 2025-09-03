const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../frontend/views'));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Route to render the EJS page
app.get('/', (req, res) => {
    // Mock data
    const product = {
        product_name: 'Sample Product',
        condition: 'New',
        content_description: 'This is a description of the product.',
    };

    const images = [
        { filename: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgAAABwSURBVHjaYvz/AwABBgI6GgoHhKUBYFxAATvQNgFxAALdE6OxHgFgAqA0tISAKgY8V0sPUIhgiF9aJxGgFEl3cS1twlES3h4y5m4Q8HJlD6MkFeZ5/0QkEBABJBgGxkD3AALXQQwBFDJECCgMBTgAQwCg1glKksy7Q5A8EUTRQgwEAAAAASUVORK5CYII=' },
        { filename: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgAAABwSURBVHjaYvz/AwABBgI6GgoHhKUBYFxAATvQNgFxAALdE6OxHgFgAqA0tISAKgY8V0sPUIhgiF9aJxGgFEl3cS1twlES3h4y5m4Q8HJlD6MkFeZ5/0QkEBABJBgGxkD3AALXQQwBFDJECCgMBTgAQwCg1glKksy7Q5A8EUTRQgwEAAAAASUVORK5CYII=' },
        // Add more placeholder images if needed
    ];

    res.render('show_product', { product, images });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
