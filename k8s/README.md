# Kubernetes Deployment - Fayol

Configuração completa de deployment do Fayol no Kubernetes com HPA (Horizontal Pod Autoscaler).

## Estrutura de Diretórios

```
k8s/
├── base/                    # Configurações base
│   ├── backend/            # NestJS API
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── hpa.yaml
│   │   └── kustomization.yaml
│   ├── web-app/            # Next.js Frontend
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── hpa.yaml
│   │   └── kustomization.yaml
│   ├── python-ai/          # Python AI Service
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── hpa.yaml
│   │   ├── pvc.yaml
│   │   └── kustomization.yaml
│   ├── bi-reports/         # BI Reports Service
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── hpa.yaml
│   │   └── kustomization.yaml
│   ├── infrastructure/     # PostgreSQL, Redis, Ingress
│   │   ├── postgres.yaml
│   │   ├── redis.yaml
│   │   ├── ingress.yaml
│   │   └── kustomization.yaml
│   ├── configmap.yaml      # ConfigMap global
│   ├── secrets.template.yaml
│   └── kustomization.yaml
├── overlays/               # Configurações por ambiente
│   ├── dev/
│   │   └── kustomization.yaml
│   ├── staging/
│   │   └── kustomization.yaml
│   └── production/
│       ├── kustomization.yaml
│       ├── replicas-patch.yaml
│       └── resources-patch.yaml
└── README.md
```

## Pré-requisitos

### 1. Cluster Kubernetes

Você precisa de um cluster Kubernetes. Opções:

- **Local**: Minikube, Kind, K3s
- **Cloud**: GKE (Google), EKS (AWS), AKS (Azure), DigitalOcean Kubernetes

```bash
# Exemplo com Minikube
minikube start --cpus 4 --memory 8192

# Exemplo com Kind
kind create cluster --name fayol
```

### 2. Ferramentas CLI

```bash
# kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

# kustomize
curl -s "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh" | bash

# helm (opcional)
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

### 3. Metrics Server (para HPA)

O HPA precisa do Metrics Server para coletar métricas de CPU/memória:

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Para Minikube
minikube addons enable metrics-server
```

### 4. Ingress Controller

```bash
# NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml

# Para Minikube
minikube addons enable ingress
```

### 5. Cert Manager (para SSL/TLS)

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

## Configuração de Secrets

### Método 1: Criar manualmente (desenvolvimento)

```bash
# Copiar template
cp k8s/base/secrets.template.yaml k8s/base/secrets.yaml

# Editar com valores reais
nano k8s/base/secrets.yaml

# NÃO COMMITAR secrets.yaml!
echo "k8s/base/secrets.yaml" >> .gitignore
```

### Método 2: Usar kubectl (recomendado)

```bash
kubectl create namespace fayol-production

kubectl create secret generic fayol-secrets \
  --namespace=fayol-production \
  --from-literal=postgres-user=fayol_user \
  --from-literal=postgres-password=$(openssl rand -base64 32) \
  --from-literal=database-url=postgresql://... \
  --from-literal=redis-password=$(openssl rand -base64 32) \
  --from-literal=redis-url=redis://... \
  --from-literal=jwt-secret=$(openssl rand -base64 64) \
  --from-literal=jwt-refresh-secret=$(openssl rand -base64 64) \
  --from-literal=nextauth-secret=$(openssl rand -base64 64)
```

### Método 3: Sealed Secrets (produção)

```bash
# Instalar Sealed Secrets controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# Instalar CLI
wget https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/kubeseal-linux-amd64
chmod +x kubeseal-linux-amd64
sudo mv kubeseal-linux-amd64 /usr/local/bin/kubeseal

# Criar sealed secret
kubectl create secret generic fayol-secrets \
  --dry-run=client \
  --from-literal=postgres-password=... \
  -o yaml | kubeseal -o yaml > k8s/base/sealed-secrets.yaml

# Agora você pode commitar sealed-secrets.yaml com segurança
```

## Deploy

### 1. Build e Push das Imagens

```bash
# Backend
docker build -t fayol/backend:v1.0.0 -f apps/backend/Dockerfile .
docker push fayol/backend:v1.0.0

# Web App
docker build -t fayol/web-app:v1.0.0 -f apps/web-app/Dockerfile .
docker push fayol/web-app:v1.0.0

# Python AI
docker build -t fayol/python-ai:v1.0.0 -f libs/python-ai/Dockerfile .
docker push fayol/python-ai:v1.0.0

# BI Reports
docker build -t fayol/bi-reports:v1.0.0 -f libs/bi-reports/Dockerfile .
docker push fayol/bi-reports:v1.0.0
```

### 2. Deploy em Desenvolvimento

```bash
# Criar namespace
kubectl create namespace fayol-dev

# Aplicar configurações
kubectl apply -k k8s/overlays/dev

# Verificar status
kubectl get pods -n fayol-dev
kubectl get svc -n fayol-dev
kubectl get hpa -n fayol-dev
```

### 3. Deploy em Produção

```bash
# Criar namespace
kubectl create namespace fayol-production

# Criar secrets (ver seção anterior)
kubectl create secret generic fayol-secrets ...

# Aplicar configurações
kubectl apply -k k8s/overlays/production

# Verificar deployment
kubectl get all -n fayol-production
kubectl get hpa -n fayol-production
```

## HPA (Horizontal Pod Autoscaler)

### Configurações por Serviço

| Serviço      | Min Replicas | Max Replicas | CPU Target | Memory Target |
|--------------|--------------|--------------|------------|---------------|
| Backend      | 2            | 10           | 70%        | 80%           |
| Web App      | 2            | 20           | 60%        | 75%           |
| Python AI    | 1            | 5            | 75%        | 85%           |
| BI Reports   | 1            | 8            | 70%        | 80%           |

### Monitorar HPA

```bash
# Ver status do HPA
kubectl get hpa -n fayol-production

# Detalhes do HPA
kubectl describe hpa fayol-backend-hpa -n fayol-production

# Watch em tempo real
watch kubectl get hpa -n fayol-production
```

### Testar Autoscaling

```bash
# Gerar carga no backend
kubectl run -i --tty load-generator --rm --image=busybox --restart=Never -- /bin/sh

# Dentro do container
while true; do wget -q -O- http://fayol-backend.fayol-production.svc.cluster.local:3333/api/health; done
```

## Monitoramento

### Logs

```bash
# Logs de um pod específico
kubectl logs -f <pod-name> -n fayol-production

# Logs de todos os pods de um deployment
kubectl logs -f deployment/fayol-backend -n fayol-production

# Logs dos últimos 100 linhas
kubectl logs --tail=100 <pod-name> -n fayol-production
```

### Métricas

```bash
# CPU e memória dos pods
kubectl top pods -n fayol-production

# CPU e memória dos nodes
kubectl top nodes

# Métricas detalhadas
kubectl get --raw /apis/metrics.k8s.io/v1beta1/namespaces/fayol-production/pods
```

### Health Checks

```bash
# Verificar health de todos os pods
kubectl get pods -n fayol-production -o wide

# Executar health check manualmente
kubectl exec -it <pod-name> -n fayol-production -- curl http://localhost:3333/api/health
```

## Troubleshooting

### Pods não iniciam

```bash
# Verificar eventos
kubectl get events -n fayol-production --sort-by='.lastTimestamp'

# Descrever pod
kubectl describe pod <pod-name> -n fayol-production

# Logs do pod
kubectl logs <pod-name> -n fayol-production --previous
```

### HPA não funciona

```bash
# Verificar Metrics Server
kubectl get deployment metrics-server -n kube-system

# Verificar métricas disponíveis
kubectl get --raw /apis/metrics.k8s.io/v1beta1/nodes
kubectl get --raw /apis/metrics.k8s.io/v1beta1/pods

# Ver eventos do HPA
kubectl describe hpa <hpa-name> -n fayol-production
```

### Problemas de conectividade

```bash
# Testar DNS
kubectl run -it --rm debug --image=busybox --restart=Never -- nslookup fayol-backend.fayol-production.svc.cluster.local

# Testar conectividade
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- curl http://fayol-backend.fayol-production.svc.cluster.local:3333/api/health
```

## Atualizações

### Rolling Update

```bash
# Atualizar imagem
kubectl set image deployment/fayol-backend backend=fayol/backend:v1.1.0 -n fayol-production

# Verificar rollout
kubectl rollout status deployment/fayol-backend -n fayol-production

# Ver histórico
kubectl rollout history deployment/fayol-backend -n fayol-production
```

### Rollback

```bash
# Rollback para versão anterior
kubectl rollout undo deployment/fayol-backend -n fayol-production

# Rollback para revisão específica
kubectl rollout undo deployment/fayol-backend --to-revision=2 -n fayol-production
```

## Backup

### Backup do Banco de Dados

```bash
# Criar CronJob para backup
kubectl apply -f - <<EOF
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: fayol-production
spec:
  schedule: "0 2 * * *"  # 2 AM diariamente
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:15-alpine
            command:
            - /bin/sh
            - -c
            - pg_dump -h postgres -U fayol_user fayol | gzip > /backup/fayol-\$(date +\%Y\%m\%d-\%H\%M\%S).sql.gz
            env:
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: fayol-secrets
                  key: postgres-password
            volumeMounts:
            - name: backup
              mountPath: /backup
          volumes:
          - name: backup
            persistentVolumeClaim:
              claimName: backup-pvc
          restartPolicy: OnFailure
EOF
```

## Comandos Úteis

```bash
# Ver todos os recursos
kubectl get all -n fayol-production

# Escalar manualmente
kubectl scale deployment fayol-backend --replicas=5 -n fayol-production

# Port forward (acesso local)
kubectl port-forward svc/fayol-backend 3333:3333 -n fayol-production

# Exec em um pod
kubectl exec -it <pod-name> -n fayol-production -- /bin/sh

# Copiar arquivos
kubectl cp <pod-name>:/path/to/file ./local-file -n fayol-production

# Deletar tudo
kubectl delete -k k8s/overlays/production
```

## Segurança

### Network Policies

```bash
# Criar Network Policy para isolar pods
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-network-policy
  namespace: fayol-production
spec:
  podSelector:
    matchLabels:
      app: fayol-backend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: fayol-web-app
    ports:
    - protocol: TCP
      port: 3333
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
EOF
```

### Pod Security Standards

```bash
# Aplicar Pod Security Standards
kubectl label namespace fayol-production pod-security.kubernetes.io/enforce=restricted
kubectl label namespace fayol-production pod-security.kubernetes.io/audit=restricted
kubectl label namespace fayol-production pod-security.kubernetes.io/warn=restricted
```

## Referências

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Horizontal Pod Autoscaler](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
- [Kustomize](https://kustomize.io/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [Cert Manager](https://cert-manager.io/)
- [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets)
