const express = require("express");
const app = express();
app.use(express.json());

const {Pool} = require("pg");

const pool = new Pool({
	user: "cyf",
	host: "localhost",
	database: "cyf_ecommerce",
	password: "cyf",
	port: 5432,
});

// get all customers
app.get("/customers", function (req, res) {
	pool
		.query("select * from customers")
		.then((result) => res.json(result.rows))
		.catch((error) => {
			console.error(error);
			res.status(500).json(error);
		});
});

// get all suppliers
app.get("/suppliers", function (req, res) {
	pool
		.query("select * from suppliers")
		.then((result) => res.json(result.rows))
		.catch((error) => {
			console.error(error);
			res.status(500).json(error);
		});
});

// single customer by id
app.get("/customers/:customerId", function (req, res) {
	const customerId = req.params.customerId;

	pool
		.query("SELECT * FROM customers WHERE id=$1", [customerId])
		.then((result) => res.json(result.rows))
		.catch((error) => {
			console.error(error);
			res.status(500).json(error);
		});
});

// create a new customer
app.post("/customers", function (req, res) {
	const newCustomerName = req.body.name;
	const newCustomerAddress = req.body.address;
	const newCustomerCity = req.body.city;
	const newCustomerCountry = req.body.country;

	if (!req.body.name || !req.body.address || !req.body.city || !req.body.country) {
		return res.status(400).send("All fields should be entered.");
	}

	pool.query("select * from customers where name=$1", [newCustomerName]).then((result) => {
		if (result.rows.length > 0) {
			return res.status(400).send("A customer with the same name already exists!");
		} else {
			const query = "insert into customers (name, address, city, country) VALUES ($1, $2, $3, $4)";
			pool
				.query(query, [newCustomerName, newCustomerAddress, newCustomerCity, newCustomerCountry])
				.then(() => res.send("customer created!"))
				.catch((error) => {
					console.error(error);
					res.status(500).json(error);
				});
		}
	});
});

// update an existing customer
app.put("/customers/:customerId", function (req, res) {
	const customerId = req.params.customerId;
	const newdetails = req.body;

	pool
		.query("UPDATE customers SET newdetails=$1 WHERE id=$2", [newdetails, customerId])
		.then(() => res.send(`Customer ${customerId} updated!`))
		.catch((error) => {
			console.error(error);
			res.status(500).json(error);
		});
});

// delete an order by id
app.delete("/orders/:orderId", function (req, res) {
	const orderId = req.params.orderId;

	pool
		.query("DELETE FROM orders WHERE id=$1", [orderId])
		.then(() => res.send(`order ${orderId} deleted!`))
		.catch((error) => {
			console.error(error);
			res.status(500).json(error);
		});
});

// delete a customer that has no orders
app.delete("/customers/:customerId", function (req, res) {
	const customerId = req.params.customerId;

	pool
		.query("DELETE FROM customers WHERE id=$1", [customerId])
		.then(() => res.send(`Customer ${customerId} deleted!`))
		.catch((error) => {
			console.error(error);
			res.status(500).json(error);
		});
});

// Get all products
app.get("/products", (req, res) => {
	pool
		.query("select * from products inner join product_availability on products.id=product_availability.prod_id inner join suppliers on suppliers.id=product_availability.supp_id")
		.then((result) => res.json(result.rows))
		.catch((error) => {
			console.error(error);
			res.status(500).json(error);
		});
});

// Create a new product
app.post("/products", function (req, res) {
	const newProduct = req.body.product_name;

	if (!req.body.product) {
		return res.status(400).send("Please enter product name");
	}

	pool.query("select * from products where product_name=$1", [newProduct]).then((result) => {
		if (result.rows.length > 0) {
			return res.status(400).send("A product with this name already exists!");
		} else {
			const query = "insert into products (product_name) VALUES ($1)";
			pool
				.query(query, [newProduct])
				.then(() => res.send("Product created!"))
				.catch((error) => {
					console.error(error);
					res.status(500).json(error);
				});
		}
	});
});

// get customer orders
app.get("/customers/:customerId/orders", function (req, res) {
	const customerId = req.params.customerId;

	pool
	.query(
		`select order_reference, order_date, product_name, unit_price, supplier_name, quantity from orders
  		join order_items on orders.id = order_items.order_id
  		join products on order_items.product_id = products.id
  		join product_availability on order_items.product_id = product_availability.prod_id
  		join suppliers ON order_items.supplier_id = suppliers.id
  		where orders.customer_id = '${customerId}'`
		)
		.then((result) => res.json(result.rows))
		.catch((error) => {
			console.error(error);
			res.status(500).json(error);
		});
});

// availability - need to check integer
app.post("/availability", function (req, res) {
	const newProductPrice = req.body.unit_price;
	const newProductSupplier = req.body.supplier_id;
	const newProductId = req.body.prod_id;

	if (!req.body.product_price) {
		return res.status(400).send("Please enter product price");
	}

	if (!req.body.supplier_id) {
		return res.status(400).send("Please enter supplier id");
	}

	if(!req.body.prod_id){
		return res.status(400).send("Please enter product id")
	}

	pool.query("select * from  availability where product_id $1", [newProductId]).then((result) => {
		if (result.rows.length > 0) {
			return res.status(400).send("A product with this id already exists!");
		} else {
			const query = "insert into availability(newProductId, newProductSupplier, newProductPrice) VALUES ($1, $2, $3)";
			pool
				.query(query, [newProductId, newProductSupplier, newProductPrice])
				.then(() => res.send("Product availbility created!"))
				.catch((error) => {
					console.error(error);
					res.status(500).json(error);
				});
		}
	});
});

// - Add a new POST endpoint `/customers/:customerId/orders` to create a new order (including an order date, and an order reference) for a customer. Check that the customerId corresponds to an existing customer or return an error.

app.get("/", (req, res) => {
	res.send("cyf ecommerce api");
});

module.exports = app;
