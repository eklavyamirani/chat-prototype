#!/bin/zsh

# set the path to the directory of the script
cd "$(dirname "$0")"

# Define the file paths
env_file=".postgres.env"
sample_file=".postgres.env.sample"

# Check if the .postgres.env file exists
if [ ! -f "$env_file" ]; then
    # If not, copy the .postgres.env.sample file
    cp "$sample_file" "$env_file"
    
    # Replace every "=" with "=postgres" in the copied file
    sed -i '' 's/=/=postgres/g' "$env_file"
fi
