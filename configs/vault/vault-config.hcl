# HashiCorp Vault Configuration
# =================================
# Configuração para ambiente de desenvolvimento

ui = true

# Listener HTTP (desenvolvimento)
listener "tcp" {
  address = "0.0.0.0:8200"
  tls_disable = 1
}

# Storage backend (file system para dev)
storage "file" {
  path = "/vault/data"
}

# API address
api_addr = "http://0.0.0.0:8200"

# Cluster address
cluster_addr = "http://0.0.0.0:8201"

# Disable mlock para containers (dev only)
disable_mlock = true

# Default lease duration
default_lease_ttl = "168h"  # 7 days
max_lease_ttl = "720h"      # 30 days

# Log level
log_level = "info"
