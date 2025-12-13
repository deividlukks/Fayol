# =============================================================================
# FAYOL - Phase 8 Setup Script for Windows (PowerShell)
# =============================================================================
# Usage: .\scripts\01_desenvolvimento\phase-8-setup.ps1 -Environment dev
# =============================================================================

param(
    [ValidateSet('dev', 'staging', 'prod')]
    [string]$Environment = 'dev'
)

# Configuration
$ProjectRoot = Split-Path -Parent -Path (Split-Path -Parent -Path $PSScriptRoot)
$ConfigsDir = Join-Path -Path $ProjectRoot -ChildPath 'configs'
$DockerDir = Join-Path -Path $ConfigsDir -ChildPath 'docker'
$K8sDir = Join-Path -Path $ConfigsDir -ChildPath 'kubernetes'

# Helper functions
function Print-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
}

function Print-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Print-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Print-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Check-Command {
    param([string]$CommandName)
    return $null -ne (Get-Command -Name $CommandName -ErrorAction SilentlyContinue)
}

function Check-Requirements {
    Print-Header "Checking Requirements"
    
    $allMet = $true
    
    # Check Docker
    if (Check-Command docker) {
        $dockerVersion = & docker --version
        Print-Success "Docker is installed: $dockerVersion"
    } else {
        Print-Error "Docker is not installed"
        $allMet = $false
    }
    
    # Check Docker Compose
    if (Check-Command docker-compose) {
        $composeVersion = & docker-compose --version
        Print-Success "Docker Compose is installed: $composeVersion"
    } else {
        Print-Error "Docker Compose is not installed"
        $allMet = $false
    }
    
    # Check Git
    if (Check-Command git) {
        $gitVersion = & git --version
        Print-Success "Git is installed: $gitVersion"
    } else {
        Print-Error "Git is not installed"
        $allMet = $false
    }
    
    # Check kubectl if not dev
    if ($Environment -ne 'dev') {
        if (Check-Command kubectl) {
            Print-Success "kubectl is installed"
        } else {
            Print-Warning "kubectl is not installed (required for $Environment)"
            $allMet = $false
        }
    }
    
    if (-not $allMet) {
        Print-Error "Please install missing requirements"
        exit 1
    }
}

function Setup-Dev {
    Print-Header "Setting Up Development Environment"
    
    # Create .env if it doesn't exist
    $envFile = Join-Path -Path $ProjectRoot -ChildPath '.env'
    if (-not (Test-Path $envFile)) {
        Print-Warning ".env file not found, creating from example"
        Copy-Item -Path "$ProjectRoot\.env.example" -Destination $envFile
        Print-Success ".env created (edit with your values)"
    } else {
        Print-Success ".env already exists"
    }
    
    # Build Docker images
    Print-Header "Building Docker Images"
    
    Get-ChildItem -Path $DockerDir -Filter "Dockerfile.*" | ForEach-Object {
        $serviceName = $_.Name -replace '^Dockerfile\.', ''
        Write-Host ""
        Write-Host "Building $serviceName..." -ForegroundColor Cyan
        & docker build -f $_.FullName -t "fayol-$serviceName`:dev" $ProjectRoot
        Print-Success "Built fayol-$serviceName`:dev"
    }
    
    # Start containers
    Print-Header "Starting Development Containers"
    
    Push-Location -Path $DockerDir
    & docker-compose -f "docker-compose.dev.yml" up -d
    Print-Success "Containers started"
    Pop-Location
    
    # Wait for services
    Write-Host ""
    Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Show status
    Print-Header "Verifying Services"
    
    Push-Location -Path $DockerDir
    & docker-compose -f "docker-compose.dev.yml" ps
    Pop-Location
    
    # Print access info
    Print-Header "🎉 Development Environment Ready!"
    Write-Host "Access your services:" -ForegroundColor Green
    Write-Host "  Frontend:  http://localhost:3001" -ForegroundColor Cyan
    Write-Host "  Backend:   http://localhost:3000" -ForegroundColor Cyan
    Write-Host "  Python AI: http://localhost:8000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Useful commands:" -ForegroundColor Green
    Write-Host "  View logs:    docker-compose -f $DockerDir\docker-compose.dev.yml logs -f" -ForegroundColor Gray
    Write-Host "  Stop:         docker-compose -f $DockerDir\docker-compose.dev.yml down" -ForegroundColor Gray
    Write-Host "  Rebuild:      docker-compose -f $DockerDir\docker-compose.dev.yml up -d --build" -ForegroundColor Gray
}

function Setup-Staging {
    Print-Header "Setting Up Staging Environment"
    
    Print-Warning "Staging setup requires:"
    Print-Warning "  - AWS credentials configured"
    Print-Warning "  - Docker registry access"
    Print-Warning "  - Kubernetes cluster access"
    
    $continue = Read-Host "Continue? (y/n)"
    if ($continue -ne 'y' -and $continue -ne 'Y') {
        exit 1
    }
    
    # Note: AWS and Kubernetes commands would go here
    Print-Warning "Staging deployment requires bash scripts or additional PowerShell modules"
    Print-Warning "Please use the GitHub Actions CI/CD pipeline for staging deployment"
}

function Setup-Prod {
    Print-Header "Setting Up Production Environment"
    
    Print-Warning "⚠️  PRODUCTION DEPLOYMENT - BE CAREFUL! ⚠️"
    Print-Warning "This will deploy to the production Kubernetes cluster."
    
    $confirm = Read-Host "Type 'yes' to continue"
    if ($confirm -ne 'yes') {
        Print-Error "Cancelled"
        exit 1
    }
    
    Print-Warning "Production deployment requires bash scripts or additional PowerShell modules"
    Print-Warning "Please use the GitHub Actions CI/CD pipeline for production deployment"
}

# Main execution
function Main {
    Print-Header "FAYOL - Phase 8 Setup (DevOps & CI/CD)"
    Write-Host "Environment: $Environment" -ForegroundColor Cyan
    Write-Host ""
    
    Check-Requirements
    
    switch ($Environment) {
        'dev' {
            Setup-Dev
        }
        'staging' {
            Setup-Staging
        }
        'prod' {
            Setup-Prod
        }
        default {
            Print-Error "Unknown environment: $Environment"
            exit 1
        }
    }
}

# Run main
Main
