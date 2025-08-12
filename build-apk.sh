#!/bin/bash

# Android APK构建脚本
# 此脚本用于在git环境中构建Android APK

echo "=== Nebula WeChat APK构建脚本 ==="

# 检查Java环境
check_java() {
    if ! command -v java &> /dev/null; then
        echo "❌ Java未安装"
        echo "请先安装Java 8或更高版本："
        echo "  Ubuntu/Debian: sudo apt update && sudo apt install openjdk-8-jdk"
        echo "  CentOS/RHEL: sudo yum install java-1.8.0-openjdk-devel"
        echo "  Windows: 从Oracle或OpenJDK官网下载安装"
        return 1
    fi
    
    echo "✅ Java环境已安装"
    java -version
    return 0
}

# 检查Android SDK
check_android_sdk() {
    if [ -z "$ANDROID_HOME" ]; then
        echo "❌ ANDROID_HOME环境变量未设置"
        echo "请安装Android SDK并设置ANDROID_HOME环境变量"
        echo "或者使用Android Studio自动安装SDK"
        return 1
    fi
    
    echo "✅ Android SDK路径: $ANDROID_HOME"
    return 0
}

# 清理项目
clean_project() {
    echo "🧹 清理项目..."
    cd android
    ./gradlew clean
    cd ..
}

# 构建Debug APK
build_debug() {
    echo "🔨 构建Debug APK..."
    cd android
    ./gradlew assembleDebug
    
    if [ $? -eq 0 ]; then
        echo "✅ Debug APK构建成功！"
        echo "APK位置: android/app/build/outputs/apk/debug/app-debug.apk"
        
        # 复制APK到根目录方便访问
        cp app/build/outputs/apk/debug/app-debug.apk ../nebula-debug.apk
        echo "✅ APK已复制到: nebula-debug.apk"
    else
        echo "❌ Debug APK构建失败"
        return 1
    fi
    cd ..
}

# 构建Release APK
build_release() {
    echo "🔨 构建Release APK..."
    cd android
    ./gradlew assembleRelease
    
    if [ $? -eq 0 ]; then
        echo "✅ Release APK构建成功！"
        echo "APK位置: android/app/build/outputs/apk/release/app-release.apk"
        
        # 复制APK到根目录方便访问
        cp app/build/outputs/apk/release/app-release.apk ../nebula-release.apk
        echo "✅ APK已复制到: nebula-release.apk"
    else
        echo "❌ Release APK构建失败"
        return 1
    fi
    cd ..
}

# 主函数
main() {
    echo "开始构建流程..."
    
    # 检查环境
    if ! check_java; then
        exit 1
    fi
    
    # 注意：在CI/CD环境中，ANDROID_HOME可能通过其他方式设置
    # check_android_sdk
    
    # 构建APK
    case "$1" in
        "debug")
            clean_project
            build_debug
            ;;
        "release")
            clean_project
            build_release
            ;;
        "both"|"")
            clean_project
            build_debug
            build_release
            ;;
        "clean")
            clean_project
            ;;
        *)
            echo "用法: $0 [debug|release|both|clean]"
            echo "  debug   - 构建Debug版本APK"
            echo "  release - 构建Release版本APK"  
            echo "  both    - 构建两个版本APK（默认）"
            echo "  clean   - 仅清理项目"
            exit 1
            ;;
    esac
    
    echo "构建流程完成！"
}

# 运行主函数
main "$@"