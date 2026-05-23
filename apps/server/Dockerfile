# syntax=docker/dockerfile:1

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY unimap.sln ./
COPY api/api.csproj api/
COPY app/app.csproj app/
COPY domain/domain.csproj domain/
COPY infrastructure/infrastructure.csproj infrastructure/
COPY persistence/persistence.csproj persistence/

RUN dotnet restore api/api.csproj

COPY api/ api/
COPY app/ app/
COPY domain/ domain/
COPY infrastructure/ infrastructure/
COPY persistence/ persistence/

RUN dotnet publish api/api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD curl -fsS http://localhost:8080/api/locations/markers || exit 1

ENTRYPOINT ["dotnet", "api.dll"]
