from pydantic import BaseModel

class ParticleCountResponse(BaseModel):
    dark_red: int
    light_red: int
    white: int
