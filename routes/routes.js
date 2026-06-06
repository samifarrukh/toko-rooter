import mongoose from "mongoose";
import express from "express";
const router = express.Router();
import Booking from "../models/plumber.js";
import { GoogleGenAI } from "@google/genai";

let aiClient = null;

function getGeminiClient() {
    if (!aiClient) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
            console.warn("Gemini API key not configured correctly.");
            return null;
        }

        try {
            aiClient = new GoogleGenAI({
                apiKey: apiKey,
                httpOptions: {
                    headers: {
                        'User-Agent': 'aistudio-build',
                    }
                }
            });
        } catch (initError) {
            console.error("Failed to initialize Gemini AI Client:", initError);
            return null;
        }
    }
    return aiClient;
}

// Auth
router.get("/login", (req, res) => {
    res.render("login", { error: null });
});

router.post("/login", (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.LOGIN_USERNAME && password === process.env.LOGIN_PASSWORD) {
        req.session.user = username;
        return res.redirect("/dashboard");
    }
    return res.render("login", { error: "❌ Invalid username or password" });
});

router.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
});

// Pages
router.get('/', (req, res) => {
    res.render('homepage', { title: 'Fast & Reliable Plumbing Services' });
});

router.get('/about', (req, res) => {
    res.render('about', { title: 'About Us - Reliable Plumbing Pros' });
});

router.get('/contact', (req, res) => {
    const success = req.query.success;
    res.render('contact', {
        title: 'Book Your Service - Contact Us',
        success,
        message: 'We received your request! Thanks.'
    });
});

router.get('/services', (req, res) => {
    const services = [
        {
            title: 'Plumbing & Repair',
            description: 'Comprehensive general plumbing repairs for residential and commercial properties. We fix leaks, pipes, and more.',
            image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800',
            features: ['Leak Repair', 'Pipe Fixing', 'General Maintenance']
        },
        {
            title: 'Hot Water Tanks',
            description: 'Professional replacement and repair of hot water tanks. Energy-efficient options available.',
            image: 'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&q=80&w=800',
            features: ['New Install', 'Fast Repair', 'Tankless Options']
        },
        {
            title: 'Drain & Sewer',
            description: 'Advanced drain and sewer cleaning services using high-pressure technology to clear clogs.',
            image: '/images/pro1.jpg',
            features: ['Main Line Cleaning', 'Clog Removal', 'Sewer Inspection']
        },
        {
            title: 'Toilet Services',
            description: 'Toilet installation and overflow repair specialists. We handle emergency clogs and new installs.',
            image: '/images/pro2.jpg',
            features: ['New Installation', 'Overflow Repair', 'Clog Clearing']
        },
        {
            title: 'Kitchen & Faucets',
            description: 'Kitchen and vent sink repairs along with expert faucet installations for all brands.',
            image: '/images/project6.jpg',
            features: ['Sink Install', 'Faucet Repair', 'Vent Services']
        },
        {
            title: 'Sump Pumps',
            description: 'Protection for your basement. We provide new sump pump installs and rapid repair services.',
            image: '/images/water-heater.jpg',
            features: ['New Install', 'Repair Services', 'Testing & Maintenance']
        }
    ];
    res.render('service', { title: 'Toko Rooter | Professional Plumbing Services', services });
});

// API
router.post("/booking", async (req, res) => {
    try {
        const { name, email, phone, service, message } = req.body;
        await Booking.create({ name, email, phone, service, message, status: "Pending" });
        return res.redirect("/contact?success=true");
    } catch (error) {
        console.error("BOOKING ERROR:", error.message);
        return res.status(500).send("Error saving booking");
    }
});

router.get("/dashboard", async (req, res) => {
    try {
        if (!req.session.user) return res.redirect("/login");
        const allBookings = await Booking.find().sort({ createdAt: -1 });
        res.render("dashboard", { booking: allBookings });
    } catch (error) {
        console.error("DASHBOARD ERROR:", error.message);
        res.status(500).send("System Error: " + error.message);
    }
});

router.post("/delete/:id", async (req, res) => {
    if (!req.session.user) return res.status(401).send("Unauthorized");
    await Booking.findByIdAndDelete(req.params.id);
    res.redirect('/dashboard');
});

router.post('/status/:id', async (req, res) => {
    if (!req.session.user) return res.status(401).send("Unauthorized");
    const { status } = req.body;
    await Booking.findByIdAndUpdate(req.params.id, { status });
    res.redirect("/dashboard");
});

router.post("/api/chat", async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: "Message is required" });

        const msg = message.toLowerCase();
        let reply = "";

        if (msg.includes("price") || msg.includes("cost") || msg.includes("how much")) {
            reply = "Pricing depends on the job. We offer competitive rates and free estimates. Call us at +1 780-709-1080 for a quote!";
        } else if (msg.includes("book") || msg.includes("service") || msg.includes("hire") || msg.includes("help")) {
            reply = "You can book a service by visiting our 'Contact' page or calling +1 780-709-1080. We're here 24/7!";
        } else if (msg.includes("emergency") || msg.includes("burst") || msg.includes("flood")) {
            reply = "EMERGENCY! Please call +1 780-709-1080 immediately. Our 24/7 mobile units are ready to help!";
        }

        const ai = getGeminiClient();
        if (ai && !reply) {
            try {
                const prompt = `You are a plumbing assistant for "Toko Rooter". 
                Services: EMERGENCY (+1 780-709-1080), Plumbing Repair, Hot Water Tanks, Drain/Sewer, Toilet, Kitchen, Sump Pumps.
                Rules: Short answers. Professional. No markdown. Tell them to book on Contact page.
                User: ${message}`;
                
                const response = await ai.models.generateContent({
                    model: "gemini-3-flash-preview",
                    contents: prompt
                });
                reply = response.text;
            } catch (aiError) {
                console.error("AI Error:", aiError.message);
                if (aiError.message.includes("429") || aiError.message.includes("quota")) {
                    reply = "I'm a bit busy right now! Please give me a moment or call our team at +1 780-709-1080 for immediate help!";
                } else if (!reply) {
                    reply = "I'm having trouble with my AI brain right now. Please call our team at +1 780-709-1080 for help!";
                }
            }
        }

        if (!reply) {
            reply = "I'm not sure about that. Would you like to call our emergency line at +1 780-709-1080 or visit our Contact page?";
        }

        res.json({ reply });
    } catch (error) {
        console.error("Chatbot Engine Error:", error);
        res.status(500).json({ error: "Failed to process chat" });
    }
});

export default router;
