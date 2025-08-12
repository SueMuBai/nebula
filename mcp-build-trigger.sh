#!/bin/bash

# MCP APK构建触发器
# 用于通过命令行触发GitHub Actions构建

set -e

# 配置
REPO_OWNER="SueMuBai"
REPO_NAME="nebula"
WORKFLOW_FILE="mcp-manual-build.yml"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查依赖
check_dependencies() {
    if ! command -v gh &> /dev/null; then
        print_error "GitHub CLI (gh) 未安装"
        print_info "请安装GitHub CLI: https://cli.github.com/"
        exit 1
    fi
    
    if ! gh auth status &> /dev/null; then
        print_error "GitHub CLI 未登录"
        print_info "请运行: gh auth login"
        exit 1
    fi
    
    print_success "依赖检查完成"
}

# 显示帮助信息
show_help() {
    echo "MCP APK构建触发器"
    echo ""
    echo "用法:"
    echo "  $0 [选项] <构建类型>"
    echo ""
    echo "构建类型:"
    echo "  debug      - 仅构建Debug版本"
    echo "  release    - 仅构建Release版本"
    echo "  both       - 构建两个版本 (默认)"
    echo ""
    echo "选项:"
    echo "  -h, --help           显示帮助信息"
    echo "  -n, --no-release     不创建GitHub Release"
    echo "  -t, --tag TAG        自定义Release标签"
    echo "  -m, --message MSG    自定义发布说明"
    echo "  -s, --status         检查最近的构建状态"
    echo "  -l, --list          列出最近的工作流运行"
    echo ""
    echo "示例:"
    echo "  $0 both                          # 构建两个版本并创建Release"
    echo "  $0 debug -n                      # 仅构建Debug版本，不创建Release"
    echo "  $0 release -t v1.0.0 -m '正式版发布'"
    echo "  $0 -s                           # 检查构建状态"
}

# 触发GitHub Actions构建
trigger_build() {
    local build_type=$1
    local create_release=$2
    local tag=$3
    local message=$4
    
    print_info "准备触发GitHub Actions构建..."
    print_info "构建类型: $build_type"
    print_info "创建Release: $create_release"
    
    # 构建输入参数
    local inputs=""
    inputs="${inputs} -f build_type=$build_type"
    inputs="${inputs} -f create_release=$create_release"
    
    if [ -n "$tag" ]; then
        inputs="${inputs} -f release_tag=$tag"
        print_info "Release标签: $tag"
    fi
    
    if [ -n "$message" ]; then
        inputs="${inputs} -f release_notes=$message"
        print_info "发布说明: $message"
    fi
    
    # 触发工作流
    print_info "正在触发工作流..."
    
    if gh workflow run "$WORKFLOW_FILE" $inputs -R "$REPO_OWNER/$REPO_NAME"; then
        print_success "构建已触发！"
        
        # 等待一下让工作流开始
        sleep 3
        
        # 获取最新的工作流运行
        print_info "获取构建状态..."
        local run_url
        run_url=$(gh run list -w "$WORKFLOW_FILE" -L 1 --json url --jq '.[0].url' -R "$REPO_OWNER/$REPO_NAME")
        
        if [ -n "$run_url" ]; then
            print_success "构建状态: $run_url"
            print_info "你可以访问上述链接查看构建进度"
        fi
        
        # 询问是否监控构建
        read -p "是否监控构建状态? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            watch_build
        fi
    else
        print_error "工作流触发失败"
        exit 1
    fi
}

# 监控构建状态
watch_build() {
    print_info "开始监控最新构建..."
    
    while true; do
        # 获取最新的工作流运行状态
        local status
        status=$(gh run list -w "$WORKFLOW_FILE" -L 1 --json status,conclusion --jq '.[0] | "\(.status) \(.conclusion)"' -R "$REPO_OWNER/$REPO_NAME")
        
        case "$status" in
            *"completed success"*)
                print_success "构建完成！"
                break
                ;;
            *"completed failure"*)
                print_error "构建失败！"
                break
                ;;
            *"completed cancelled"*)
                print_warning "构建已取消"
                break
                ;;
            *"in_progress"*|*"queued"*|*"requested"*)
                print_info "构建进行中..."
                ;;
            *)
                print_warning "未知状态: $status"
                ;;
        esac
        
        sleep 30
    done
}

# 检查构建状态
check_status() {
    print_info "检查最近的构建状态..."
    
    gh run list -w "$WORKFLOW_FILE" -L 5 -R "$REPO_OWNER/$REPO_NAME"
    
    print_info ""
    print_info "最新构建详情:"
    gh run view -w "$WORKFLOW_FILE" -R "$REPO_OWNER/$REPO_NAME" || true
}

# 列出工作流运行
list_runs() {
    print_info "最近的工作流运行:"
    gh run list -w "$WORKFLOW_FILE" -L 10 -R "$REPO_OWNER/$REPO_NAME"
}

# 主函数
main() {
    local build_type="both"
    local create_release="true"
    local tag=""
    local message=""
    local action="build"
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -n|--no-release)
                create_release="false"
                shift
                ;;
            -t|--tag)
                tag="$2"
                shift 2
                ;;
            -m|--message)
                message="$2"
                shift 2
                ;;
            -s|--status)
                action="status"
                shift
                ;;
            -l|--list)
                action="list"
                shift
                ;;
            debug|release|both)
                build_type="$1"
                shift
                ;;
            *)
                print_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 检查依赖
    check_dependencies
    
    case $action in
        "build")
            trigger_build "$build_type" "$create_release" "$tag" "$message"
            ;;
        "status")
            check_status
            ;;
        "list")
            list_runs
            ;;
        *)
            print_error "未知操作: $action"
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"