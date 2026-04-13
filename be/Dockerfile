# ============================================
# Stage 1: Build
# ============================================
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj files first for layer caching
COPY Web/Web.csproj Web/
COPY ApplicationCore/ApplicationCore.csproj ApplicationCore/
COPY Infrastructure/Infrastructure.csproj Infrastructure/

# Restore dependencies (cached unless csproj changes)
RUN dotnet restore Web/Web.csproj

# Copy all source code
COPY . .

# Publish directly (no separate build step needed)
WORKDIR /src/Web
RUN dotnet publish Web.csproj -c Release -o /app/publish \
    --no-restore \
    /p:UseAppHost=false

# ============================================
# Stage 2: Runtime (minimal image)
# ============================================
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS final

# Add labels
LABEL maintainer="EduMind Team" \
      app="edumind-api" \
      version="1.0"

# Install curl for healthcheck
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy published output
COPY --from=build /app/publish .

# Set environment
ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_RUNNING_IN_CONTAINER=true \
    DOTNET_EnableDiagnostics=0

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/api/Course || exit 1

# Switch to non-root user
USER appuser

ENTRYPOINT ["dotnet", "Web.dll"]