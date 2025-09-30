// AI Routes for project generation
const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const User = require('../models/User');

// AI Generate Requirements API
router.post('/generate-requirements', async (req, res) => {
    try {
        const { projectName, projectDesc, type } = req.body;
        if (!req.session.userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        if (!projectName || !projectDesc) {
            return res.status(400).json({ success: false, message: 'Project name and description are required' });
        }
        
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }
        
        let prompt = `You are a project management AI assistant. Generate ${type === 'basic' ? 'basic requirements' : 'advanced features'} for the following project:

Project Name: ${projectName}
Project Description: ${projectDesc}

Please provide ${type === 'basic' ? '3-6 basic requirements' : '3-6 advanced features'} that are:
- Specific and actionable
- Relevant to the project type
- Professional and well-formatted
- Each item should be 1-2 sentences maximum

Format the response as a JSON array of strings, where each string is one requirement/feature. Example: ["Requirement 1", "Requirement 2", "Requirement 3"]`;

        const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyBKZCqmoC9WBlEFBXbeOyeMg7vf-DEtvHo";
        const requestBody = {
            contents: [{
                parts: [{ text: prompt }]
            }]
        };
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini API Error:', errorData);
            throw new Error(`Gemini API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const aiResponse = data.candidates[0].content.parts[0].text;
        
        // Parse the JSON response
        let requirements = [];
        try {
            // Extract JSON from the response (in case there's extra text)
            const jsonMatch = aiResponse.match(/\[.*\]/s);
            if (jsonMatch) {
                requirements = JSON.parse(jsonMatch[0]);
            } else {
                // Fallback: split by lines and clean up
                requirements = aiResponse.split('\n')
                    .map(line => line.trim())
                    .filter(line => line && !line.startsWith('[') && !line.startsWith(']'))
                    .map(line => line.replace(/^[-*•]\s*/, '').replace(/^"\s*/, '').replace(/"$/, ''))
                    .filter(line => line.length > 0)
                    .slice(0, 6);
            }
        } catch (parseError) {
            console.error('Error parsing AI response:', parseError);
            // Fallback: create some generic requirements
            if (type === 'basic') {
                requirements = [
                    'User authentication and authorization',
                    'Responsive design for all devices',
                    'Data validation and error handling',
                    'Basic CRUD operations',
                    'User-friendly interface'
                ];
            } else {
                requirements = [
                    'Advanced analytics and reporting',
                    'Real-time notifications',
                    'API integration capabilities',
                    'Advanced search and filtering',
                    'Performance optimization'
                ];
            }
        }
        
        if (type === 'basic') {
            res.json({
                success: true,
                basicRequirements: requirements
            });
        } else {
            res.json({
                success: true,
                advancedFeatures: requirements
            });
        }
        
    } catch (error) {
        console.error('AI Generate Requirements Error:', error);
        res.status(500).json({
            success: false,
            message: 'AI service temporarily unavailable. Please try again later.',
            error: error.message
        });
    }
});

module.exports = router;
