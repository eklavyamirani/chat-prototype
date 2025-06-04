### [Optional] seed the database
Use [seed_database.sql](.devcontainer/seed_database.sql) to seed the dev database.

To validate use ```psql -h db -U $PGUSER``` to connect to db.

### Setup instructions
1. Load the devcontainer

### create the react app in the container
```zsh
npx create-react-app <appname>
```

### create dotnet webapi
```zsh
dotnet new webapi -o <project_name> --use-controllers --use-program-main
```

### create dotnet gitignore
```zsh
dotnet new gitignore
```

### create new controller
```zsh
dotnet new apicontroller --actions --name <controller name>
```

### for devmode, enable cors
```csharp
app.UseCors(builder => 
  builder.AllowAnyOrigin()
      .AllowAnyMethod()
      .AllowAnyHeader()
);
```
