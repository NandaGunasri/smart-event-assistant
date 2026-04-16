# EventFlow AI - Smart Event Command Center

EventFlow AI is a futuristic, lightweight AI-driven web application designed to solve chaos, crowd rush, and confusion in large physical events like hackathons, sports venues, and college fests. 

It provides two distinct perspectives:
1. **Personal AI Assistant** for attendees to get real-time, crowd-aware routing.
2. **Command Center Dashboard** for event organizers to monitor live heatmaps and handle emergencies.

## Real-world Use Cases
- **Hackathons**: Prevent massive queues at food stations or check-in desks by dynamically routing attendees.
- **Stadiums**: Safely monitor and control the exit flow of 50,000+ people after a match ends by distributing attendees across different exits.
- **Conferences**: Alert participants if a specific hall has reached its seating capacity and redirect them to overflow rooms.

## AI Decision Logic
The application uses a rule-based inference engine that dynamically generates navigation instructions based on live environmental data.

- `IF Crowd Density > 85% ("High")` → Suggest alternate route and show avoidance alert.
- `IF Wait Time > 15 mins` → Suggest a delay, point to a Fast Lane, or prompt the user to use a different facility.
- `ELSE` → Output the most direct, optimal path.
- **Emergency Mode override**: Disables all normal routing and immediately directs all requests to the nearest exit, overriding normal logic and wait times.

## How to Run Locally

This application is built with 100% Vanilla HTML/CSS/JS on the frontend and a straightforward Node.js Express backend, making it incredibly fast and weighing less than a few megabytes.

### Prerequisites
- Node.js (v14 or higher recommended)

### Steps
1. Clone the repository and navigate into the folder:
   ```bash
   cd smart-event-assistant
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the application:
   ```bash
   npm start
   ```
4. Open your browser and visit: `http://localhost:8080/`

You will be greeted by the Landing Page. Open the **Command Center** in one window and the **User Assistant** in another to test real-time feedback and dynamic routing!
