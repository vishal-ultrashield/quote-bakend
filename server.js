const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// ========================================
// SHOPIFY CONFIG
// ========================================

const SHOP =
    "m1un02-nm.myshopify.com";

const ACCESS_TOKEN =
    process.env.SHOPIFY_ACCESS_TOKEN;

const API_VERSION = "2026-04";

// ========================================
// TEST ROUTE
// ========================================

app.get("/", (req, res) => {

    res.send("Backend working");

});

// ========================================
// CREATE CUSTOMER + DRAFT ORDER
// ========================================

app.post("/create-quote-order", async (req, res) => {

    try {

        const {
            customer,
            cart
        } = req.body;

        // ========================================
        // SEARCH CUSTOMER
        // ========================================

        let customerId = null;

        const searchResponse = await fetch(

            `https://${SHOP}/admin/api/${API_VERSION}/customers/search.json?query=email:${customer.email}`,

            {
                headers: {
                    "X-Shopify-Access-Token":
                        ACCESS_TOKEN,

                    "Content-Type":
                        "application/json"
                }
            }

        );

        const searchData =
            await searchResponse.json();

        // ========================================
        // EXISTING CUSTOMER
        // ========================================

        if (
            searchData.customers &&
            searchData.customers.length > 0
        ) {

            customerId =
                searchData.customers[0].id;

        }

        // ========================================
        // CREATE CUSTOMER
        // ========================================

        else {

            const customerResponse =
                await fetch(

                    `https://${SHOP}/admin/api/${API_VERSION}/customers.json`,

                    {
                        method: "POST",

                        headers: {

                            "X-Shopify-Access-Token":
                                ACCESS_TOKEN,

                            "Content-Type":
                                "application/json"

                        },

                        body: JSON.stringify({

                            customer: {

                                first_name:
                                    customer.name,

                                email:
                                    customer.email,

                                phone:
                                    customer.phone,

                                note:
                                    customer.notes,

                                tags:
                                    "Quote Customer"

                            }

                        })

                    }

                );

            const customerData =
                await customerResponse.json();

            console.log(
                "CUSTOMER RESPONSE:",
                customerData
            );

            // ========================================
            // CUSTOMER CREATE FAILED
            // ========================================

            if (
                !customerData.customer
            ) {

                return res.status(500).json({

                    success: false,

                    error:
                        customerData

                });

            }

            customerId =
                customerData.customer.id;

        }

        // ========================================
        // DRAFT ORDER LINE ITEMS
        // ========================================

        const line_items =
            cart.map(item => {

                return {

                    title:
                        item.title,

                    quantity:
                        parseInt(item.count),

                    original_unit_price:
                        parseFloat(item.price),

                    properties: [

                        {
                            name: "Bulk Quantity",
                            value: item.qty
                        },

                        {
                            name: "Bulk Unit",
                            value: item.unit
                        }

                    ]

                };

            });

        // ========================================
        // CREATE DRAFT ORDER
        // ========================================

        const draftOrderResponse =
            await fetch(

                `https://${SHOP}/admin/api/${API_VERSION}/draft_orders.json`,

                {

                    method: "POST",

                    headers: {

                        "X-Shopify-Access-Token":
                            ACCESS_TOKEN,

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        draft_order: {

                            customer: {
                                id: customerId
                            },

                            note:
                                customer.notes,

                            line_items

                        }

                    })

                }

            );

        const draftOrderData =
            await draftOrderResponse.json();

        // ========================================
        // SUCCESS
        // ========================================

        res.json({

            success: true,

            order:
                draftOrderData

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            error:
                err.message

        });

    }

});

// ========================================
// SERVER
// ========================================

const PORT =
    process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        `Server running on port ${PORT}`
    );

});