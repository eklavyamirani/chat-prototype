### Setup instructions
1. Load the devcontainer
2. run `npm i`

### Run the app
`npm run dev`

### function calling sample definition
#### name
add_memory

#### description
allows storing relevant pieces of information into long term memory to add personalized experience for the user

#### params
```json
{
  "type": "object",
  "properties": {
    "memory": {
      "type": "string"
    }
  },
  "required": [
    "memory"
  ]
}
```

#### body
```js
console.log("memory called " + args.memory);
return "stored " + args.memory
```