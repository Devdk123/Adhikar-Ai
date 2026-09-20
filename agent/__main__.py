# LiveKit Cloud Agent Entry Point
# Starts the agent worker connected to LiveKit Cloud

from agent.src.agent import server
from livekit.agents import cli

cli.run_app(server)
