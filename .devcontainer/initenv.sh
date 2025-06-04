#!/bin/bash

set -e

# set the path to the directory of the script
cd .devcontainer

# Define the file paths
env_file=".postgres.env"
sample_file=".postgres.env.sample"

# Check if the .postgres.env file exists
if [ ! -f "$env_file" ]; then
    # If not, copy the .postgres.env.sample file
    cp "$sample_file" "$env_file"
    
    # Replace every "=" with "=postgres" in the copied file
    awk -F= '{print $1"=postgres"}' "$sample_file" > "$env_file"
fi
